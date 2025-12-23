import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pexjet/database";
import { verifyAccessToken, extractTokenFromHeader } from "@pexjet/lib";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const token = extractTokenFromHeader(request.headers.get("authorization"));
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyAccessToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Check if aircraft exists
    const aircraft = await prisma.aircraft.findUnique({
      where: { id: params.id },
    });

    if (!aircraft) {
      return NextResponse.json(
        { error: "Aircraft not found" },
        { status: 404 },
      );
    }

    const formData = await request.formData();
    const files = formData.getAll("images") as File[];
    const type = formData.get("type") as string;
    const thumbnailFile = formData.get("thumbnail") as File | null;

    // Handle thumbnail upload
    if (thumbnailFile && thumbnailFile.size > 0) {
      const bytes = await thumbnailFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const result = await new Promise<any>((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: `pexjet/aircraft/${params.id}/thumbnail`,
              resource_type: "image",
              transformation: [
                { width: 600, height: 400, crop: "fill" },
                { quality: "auto" },
                { fetch_format: "auto" },
              ],
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            },
          )
          .end(buffer);
      });

      const updatedAircraft = await prisma.aircraft.update({
        where: { id: params.id },
        data: { thumbnailImage: result.secure_url },
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          action: "AIRCRAFT_UPDATE",
          targetType: "Aircraft",
          targetId: aircraft.id,
          adminId: payload.sub,
          description: `Updated thumbnail image for ${aircraft.name}`,
          ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        },
      });

      return NextResponse.json({
        aircraft: updatedAircraft,
        thumbnailUrl: result.secure_url,
      });
    }

    // Handle exterior/interior images upload
    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "No images provided" },
        { status: 400 },
      );
    }

    if (!type || !["exterior", "interior"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid image type" },
        { status: 400 },
      );
    }

    const uploadedUrls: string[] = [];

    for (const file of files) {
      // Convert file to buffer
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Upload to Cloudinary
      const result = await new Promise<any>((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: `pexjet/aircraft/${params.id}/${type}`,
              resource_type: "image",
              transformation: [
                { width: 1200, height: 800, crop: "limit" },
                { quality: "auto" },
                { fetch_format: "auto" },
              ],
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            },
          )
          .end(buffer);
      });

      uploadedUrls.push(result.secure_url);
    }

    // Update aircraft with new images
    const currentImages =
      type === "exterior" ? aircraft.exteriorImages : aircraft.interiorImages;
    const updatedImages = [...currentImages, ...uploadedUrls];

    const updateData =
      type === "exterior"
        ? {
            exteriorImages: updatedImages,
            thumbnailImage: aircraft.thumbnailImage || uploadedUrls[0],
          }
        : { interiorImages: updatedImages };

    const updatedAircraft = await prisma.aircraft.update({
      where: { id: params.id },
      data: updateData,
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "AIRCRAFT_UPDATE",
        targetType: "Aircraft",
        targetId: aircraft.id,
        adminId: payload.sub,
        description: `Uploaded ${uploadedUrls.length} ${type} image(s) to ${aircraft.name}`,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      },
    });

    return NextResponse.json({
      aircraft: updatedAircraft,
      uploadedUrls,
    });
  } catch (error: any) {
    console.error("Image upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload images" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const token = extractTokenFromHeader(request.headers.get("authorization"));
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyAccessToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await request.json();
    const { imageUrl, type } = body;

    if (!imageUrl || !type) {
      return NextResponse.json(
        { error: "Missing imageUrl or type" },
        { status: 400 },
      );
    }

    // Check if aircraft exists
    const aircraft = await prisma.aircraft.findUnique({
      where: { id: params.id },
    });

    if (!aircraft) {
      return NextResponse.json(
        { error: "Aircraft not found" },
        { status: 404 },
      );
    }

    // Extract public_id from Cloudinary URL for deletion
    try {
      const urlParts = imageUrl.split("/");
      const publicIdWithExtension = urlParts.slice(-4).join("/"); // pexjet/aircraft/id/type/filename
      const publicId = publicIdWithExtension.replace(/\.[^/.]+$/, ""); // Remove extension

      await cloudinary.uploader.destroy(publicId);
    } catch (cloudinaryError) {
      console.error("Cloudinary delete error:", cloudinaryError);
      // Continue even if Cloudinary delete fails
    }

    // Remove image from aircraft
    const currentImages =
      type === "exterior" ? aircraft.exteriorImages : aircraft.interiorImages;
    const updatedImages = currentImages.filter((img) => img !== imageUrl);

    const updateData: any =
      type === "exterior"
        ? { exteriorImages: updatedImages }
        : { interiorImages: updatedImages };

    // Update thumbnail if deleted image was the thumbnail
    if (type === "exterior" && aircraft.thumbnailImage === imageUrl) {
      updateData.thumbnailImage = updatedImages[0] || null;
    }

    const updatedAircraft = await prisma.aircraft.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({ aircraft: updatedAircraft });
  } catch (error: any) {
    console.error("Image delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete image" },
      { status: 500 },
    );
  }
}

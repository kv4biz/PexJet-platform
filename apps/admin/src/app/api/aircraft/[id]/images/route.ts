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

// Helper function to delete image from Cloudinary
const deleteCloudinaryImage = async (imageUrl: string) => {
  try {
    // Extract public_id from Cloudinary URL
    // URL format: https://res.cloudinary.com/cloud_name/image/upload/v123/folder/public_id.ext
    const urlParts = imageUrl.split("/");
    const uploadIndex = urlParts.indexOf("upload");
    if (uploadIndex === -1) return;

    // Get everything after 'upload/vXXX/' and remove extension
    const pathAfterUpload = urlParts.slice(uploadIndex + 2).join("/");
    const publicId = pathAfterUpload.replace(/\.[^/.]+$/, "");

    console.log("Deleting previous Cloudinary image with publicId:", publicId);
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Failed to delete previous Cloudinary image:", error);
  }
};

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

    // Validate Cloudinary configuration
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      console.error("Cloudinary credentials not configured");
      return NextResponse.json(
        {
          error:
            "Image upload service not configured. Please contact administrator.",
        },
        { status: 503 },
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

    const formData = await request.formData();
    const imageFile = formData.get("image") as File | null;

    if (!imageFile || imageFile.size === 0) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // Validate file type
    if (!imageFile.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload an image." },
        { status: 400 },
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (imageFile.size > maxSize) {
      return NextResponse.json(
        { error: "Image too large. Maximum size is 5MB." },
        { status: 400 },
      );
    }

    // Delete previous image from Cloudinary if exists
    if (aircraft.image) {
      await deleteCloudinaryImage(aircraft.image);
    }

    // Convert file to buffer
    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: `pexjet/aircraft/${params.id}`,
            resource_type: "image",
            transformation: [
              { width: 1200, height: 800, crop: "fit" },
              { quality: "auto:good" },
            ],
          },
          (error, result) => {
            if (error) {
              console.error("Cloudinary upload error:", error);
              reject(error);
            } else {
              console.log("Cloudinary upload success:", result);
              resolve(result);
            }
          },
        )
        .end(buffer);
    });

    // Update aircraft with new image
    const updatedAircraft = await prisma.aircraft.update({
      where: { id: params.id },
      data: { image: result.secure_url },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "AIRCRAFT_UPDATE",
        targetType: "Aircraft",
        targetId: aircraft.id,
        adminId: payload.sub,
        description: `Updated image for ${aircraft.name}`,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      },
    });

    return NextResponse.json({
      aircraft: updatedAircraft,
      imageUrl: result.secure_url,
    });
  } catch (error: any) {
    console.error("Image upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
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

    // Delete from Cloudinary if image exists
    if (aircraft.image) {
      try {
        const urlParts = aircraft.image.split("/");
        const publicIdWithExtension = urlParts.slice(-3).join("/");
        const publicId = publicIdWithExtension.replace(/\.[^/.]+$/, "");
        await cloudinary.uploader.destroy(publicId);
      } catch (cloudinaryError) {
        console.error("Cloudinary delete error:", cloudinaryError);
      }
    }

    // Remove image from aircraft
    const updatedAircraft = await prisma.aircraft.update({
      where: { id: params.id },
      data: { image: null },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "AIRCRAFT_UPDATE",
        targetType: "Aircraft",
        targetId: aircraft.id,
        adminId: payload.sub,
        description: `Removed image from ${aircraft.name}`,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      },
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

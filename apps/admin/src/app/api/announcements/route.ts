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

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const token = extractTokenFromHeader(request.headers.get("authorization"));
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyAccessToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const skip = (page - 1) * limit;

    // Fetch announcements with pagination
    const [announcements, total] = await Promise.all([
      prisma.announcement.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          createdBy: {
            select: { fullName: true },
          },
        },
      }),
      prisma.announcement.count(),
    ]);

    return NextResponse.json({
      announcements,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error("Announcements fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch announcements" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const token = extractTokenFromHeader(request.headers.get("authorization"));
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyAccessToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const formData = await request.formData();
    const title = formData.get("title") as string;
    const message = formData.get("message") as string;
    const imageFile = formData.get("image") as File | null;
    const sendNow = formData.get("sendNow") === "true";

    if (!title || !message) {
      return NextResponse.json(
        { error: "Title and message are required" },
        { status: 400 },
      );
    }

    let imageUrl: string | null = null;

    // Upload image if provided
    if (imageFile && imageFile.size > 0) {
      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const result = await new Promise<any>((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: "pexjet/announcements",
              resource_type: "image",
              transformation: [
                { width: 800, height: 600, crop: "limit" },
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

      imageUrl = result.secure_url;
    }

    // Create announcement
    const announcement = await prisma.announcement.create({
      data: {
        title,
        message,
        imageUrl,
        createdById: payload.sub,
        sentAt: sendNow ? new Date() : null,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "ANNOUNCEMENT_CREATE",
        targetType: "Announcement",
        targetId: announcement.id,
        adminId: payload.sub,
        description: `Created announcement: ${title}`,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      },
    });

    // Send to subscribers AND clients if sendNow is true
    if (sendNow) {
      // Fetch active subscribers
      const activeSubscribers = await prisma.emptyLegSubscription.findMany({
        where: { isActive: true },
        select: { phone: true },
      });

      // Fetch all clients with phone numbers
      const clients = await prisma.client.findMany({
        select: { phone: true },
      });

      // Combine and deduplicate phone numbers
      const allPhones = new Set<string>();
      for (const subscriber of activeSubscribers) {
        if (subscriber.phone) allPhones.add(subscriber.phone);
      }
      for (const client of clients) {
        if (client.phone) allPhones.add(client.phone);
      }
      const uniqueRecipients = Array.from(allPhones);

      // Check Twilio credentials
      const hasTwilioCredentials =
        process.env.TWILIO_ACCOUNT_SID &&
        process.env.TWILIO_AUTH_TOKEN &&
        process.env.TWILIO_WHATSAPP_NUMBER;

      if (hasTwilioCredentials && uniqueRecipients.length > 0) {
        const twilio = require("twilio")(
          process.env.TWILIO_ACCOUNT_SID,
          process.env.TWILIO_AUTH_TOKEN,
        );

        // Format phone for WhatsApp - handles multiple formats
        const formatPhone = (phone: string) => {
          let formatted = phone.replace(/\D/g, "");
          // Remove leading + if present (already stripped by regex but for safety)
          if (formatted.startsWith("+")) {
            formatted = formatted.substring(1);
          }
          // Nigerian numbers: convert 0xxx to 234xxx
          if (formatted.startsWith("0") && formatted.length === 11) {
            formatted = "234" + formatted.substring(1);
          }
          // If 10 digits without country code, assume Nigerian
          if (formatted.length === 10 && !formatted.startsWith("234")) {
            formatted = "234" + formatted;
          }
          return formatted;
        };

        console.log(
          `Sending announcement to ${uniqueRecipients.length} recipients (${activeSubscribers.length} subscribers + ${clients.length} clients, deduplicated)...`,
        );

        const announcementMessage =
          `📢 *${title}*\n\n${message}\n\n` + `From PexJet Aviation`;

        let sentCount = 0;
        let failedCount = 0;

        for (const phone of uniqueRecipients) {
          const formattedPhone = formatPhone(phone);

          try {
            if (imageUrl) {
              await twilio.messages.create({
                body: announcementMessage,
                from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
                to: `whatsapp:+${formattedPhone}`,
                mediaUrl: [imageUrl],
              });
            } else {
              await twilio.messages.create({
                body: announcementMessage,
                from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
                to: `whatsapp:+${formattedPhone}`,
              });
            }
            sentCount++;
          } catch (twilioError: any) {
            console.error(
              `Failed to send to ${phone} (formatted: +${formattedPhone}):`,
              twilioError.message,
              twilioError.code ? `Code: ${twilioError.code}` : "",
            );
            failedCount++;
          }
        }

        return NextResponse.json({
          announcement,
          delivery: {
            total: uniqueRecipients.length,
            subscribers: activeSubscribers.length,
            clients: clients.length,
            sent: sentCount,
            failed: failedCount,
          },
        });
      }
    }

    return NextResponse.json({ announcement });
  } catch (error: any) {
    console.error("Announcement create error:", error);
    return NextResponse.json(
      { error: "Failed to create announcement" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Verify authentication
    const token = extractTokenFromHeader(request.headers.get("authorization"));
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyAccessToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Announcement ID is required" },
        { status: 400 },
      );
    }

    await prisma.announcement.delete({
      where: { id },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "ANNOUNCEMENT_DELETE",
        targetType: "Announcement",
        targetId: id,
        adminId: payload.sub,
        description: "Deleted announcement",
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      },
    });

    return NextResponse.json({ message: "Announcement deleted" });
  } catch (error: any) {
    console.error("Announcement delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete announcement" },
      { status: 500 },
    );
  }
}

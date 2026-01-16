import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pexjet/database";
import {
  uploadToCloudinary,
  notifyNewMessage,
  notifyReceiptUploaded,
} from "@pexjet/lib";

/**
 * Twilio Webhook for ALL incoming WhatsApp messages
 * - Stores messages in BookingMessage table
 * - Handles media uploads (receipts, documents)
 * - Links to appropriate booking (CharterQuote or EmptyLegBooking)
 * - Notifies admin group of new messages
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Parse Twilio webhook payload
    const messageSid = formData.get("MessageSid") as string;
    const from = formData.get("From") as string;
    const body = formData.get("Body") as string;
    const numMedia = parseInt((formData.get("NumMedia") as string) || "0");
    const mediaUrl0 = formData.get("MediaUrl0") as string;
    const mediaContentType0 = formData.get("MediaContentType0") as string;

    // Extract phone number (remove 'whatsapp:' prefix)
    const phoneNumber = from?.replace("whatsapp:", "");

    if (!phoneNumber) {
      console.error("[Twilio Webhook] No phone number in webhook");
      return new NextResponse("OK", { status: 200 });
    }

    console.log(`[Twilio Webhook] Message from ${phoneNumber}:`, {
      messageSid,
      body: body?.substring(0, 100),
      numMedia,
      hasMedia: !!mediaUrl0,
    });

    // Find the most recent APPROVED booking for this phone number
    const booking = await findActiveBooking(phoneNumber);

    if (!booking) {
      console.log(`[Twilio Webhook] No active booking for ${phoneNumber}`);
      // Still store as orphan message for manual review
      await storeOrphanMessage(
        phoneNumber,
        body,
        messageSid,
        mediaUrl0,
        mediaContentType0,
      );
      return new NextResponse("OK", { status: 200 });
    }

    // Upload media to Cloudinary if present
    let mediaUrl: string | null = null;
    let mediaType: string | null = null;

    if (numMedia > 0 && mediaUrl0) {
      try {
        const uploadResult = await uploadMediaToCloudinary(
          mediaUrl0,
          mediaContentType0,
        );
        mediaUrl = uploadResult.url;
        mediaType = mediaContentType0;
      } catch (uploadError) {
        console.error("[Twilio Webhook] Media upload failed:", uploadError);
        mediaUrl = mediaUrl0; // Fallback to Twilio URL
        mediaType = mediaContentType0;
      }
    }

    // Determine if this is a receipt (image with approved status)
    const isReceipt =
      mediaUrl &&
      isImageType(mediaContentType0) &&
      booking.status === "APPROVED";

    // Store the message in BookingMessage table
    const message = await prisma.bookingMessage.create({
      data: {
        ...(booking.type === "charter"
          ? { charterQuoteId: booking.id }
          : { emptyLegBookingId: booking.id }),
        direction: "INBOUND",
        messageType: "FREEFORM",
        content: body || null,
        mediaUrl,
        mediaType,
        twilioMessageSid: messageSid,
        status: "DELIVERED",
        deliveredAt: new Date(),
      },
    });

    console.log(`[Twilio Webhook] Message stored: ${message.id}`);

    // If this is a receipt image, update the booking
    if (isReceipt) {
      await updateBookingWithReceipt(booking, mediaUrl!);
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: isReceipt
          ? "CHARTER_RECEIPT_UPLOADED"
          : "EMPTY_LEG_NOTIFICATION",
        targetType:
          booking.type === "charter" ? "CharterQuote" : "EmptyLegBooking",
        targetId: booking.id,
        description: isReceipt
          ? `Client uploaded payment receipt for ${booking.referenceNumber}`
          : `New message from client for ${booking.referenceNumber}`,
        ipAddress: "twilio-webhook",
        metadata: {
          phoneNumber,
          messageSid,
          hasMedia: !!mediaUrl,
          mediaType,
          isReceipt,
        },
      },
    });

    // Send Pusher event for real-time updates
    await notifyNewMessage(booking.id, {
      id: message.id,
      direction: message.direction,
      content: message.content,
      mediaUrl: message.mediaUrl,
      sentAt: message.sentAt,
    });

    // If receipt uploaded, send receipt notification
    if (isReceipt) {
      await notifyReceiptUploaded({
        id: booking.id,
        referenceNumber: booking.referenceNumber,
        clientName: booking.clientName || "Unknown",
        receiptUrl: mediaUrl!,
      });
    }

    // Send TwiML response
    const responseMessage = isReceipt
      ? `Thank you! Your payment receipt for ${booking.referenceNumber} has been received. Our team will review and confirm shortly.`
      : `Message received for booking ${booking.referenceNumber}. Our team will respond shortly.`;

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${responseMessage}</Message>
</Response>`;

    return new NextResponse(twiml, {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  } catch (error: any) {
    console.error("[Twilio Webhook] Error:", error);
    return new NextResponse("OK", { status: 200 });
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

interface ActiveBooking {
  id: string;
  type: "charter" | "empty_leg";
  status: string;
  referenceNumber: string;
  clientPhone: string;
  clientName: string;
}

async function findActiveBooking(
  phoneNumber: string,
): Promise<ActiveBooking | null> {
  // Try multiple phone formats
  const phoneFormats = getPhoneFormats(phoneNumber);

  // Find most recent charter quote
  const charterQuote = await prisma.charterQuote.findFirst({
    where: {
      clientPhone: { in: phoneFormats },
      status: { in: ["PENDING", "APPROVED", "PAID"] },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      referenceNumber: true,
      clientPhone: true,
      clientName: true,
      createdAt: true,
    },
  });

  // Find most recent empty leg booking
  const emptyLegBooking = await prisma.emptyLegBooking.findFirst({
    where: {
      clientPhone: { in: phoneFormats },
      status: { in: ["PENDING", "APPROVED", "PAID"] },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      referenceNumber: true,
      clientPhone: true,
      clientName: true,
      createdAt: true,
    },
  });

  // Return the most recent one
  if (charterQuote && emptyLegBooking) {
    if (charterQuote.createdAt > emptyLegBooking.createdAt) {
      return { ...charterQuote, type: "charter" };
    }
    return { ...emptyLegBooking, type: "empty_leg" };
  }

  if (charterQuote) return { ...charterQuote, type: "charter" };
  if (emptyLegBooking) return { ...emptyLegBooking, type: "empty_leg" };

  return null;
}

function getPhoneFormats(phone: string): string[] {
  const cleaned = phone.replace(/[^\d+]/g, "");
  const formats = [
    cleaned,
    cleaned.replace("+", ""),
    "+" + cleaned.replace("+", ""),
  ];

  // Nigerian format conversions
  if (cleaned.startsWith("+234")) {
    formats.push("0" + cleaned.slice(4));
  } else if (cleaned.startsWith("234")) {
    formats.push("+234" + cleaned.slice(3));
    formats.push("0" + cleaned.slice(3));
  } else if (cleaned.startsWith("0")) {
    formats.push("+234" + cleaned.slice(1));
    formats.push("234" + cleaned.slice(1));
  }

  return [...new Set(formats)];
}

function isImageType(contentType: string | null): boolean {
  if (!contentType) return false;
  return contentType.startsWith("image/");
}

async function uploadMediaToCloudinary(
  twilioUrl: string,
  contentType: string,
): Promise<{ url: string }> {
  // Download from Twilio (requires auth)
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  const response = await fetch(twilioUrl, {
    headers: {
      Authorization:
        "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to download from Twilio: ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const base64 = buffer.toString("base64");
  const dataUri = `data:${contentType};base64,${base64}`;

  // Upload to Cloudinary
  const result = await uploadToCloudinary(dataUri, {
    folder: "receipts",
    resource_type: contentType.startsWith("image/") ? "image" : "raw",
  });

  return { url: result.secure_url };
}

async function updateBookingWithReceipt(
  booking: ActiveBooking,
  receiptUrl: string,
) {
  if (booking.type === "charter") {
    await prisma.charterQuote.update({
      where: { id: booking.id },
      data: {
        receiptUploadedUrl: receiptUrl,
        receiptUploadedAt: new Date(),
      },
    });
  } else {
    await prisma.emptyLegBooking.update({
      where: { id: booking.id },
      data: {
        receiptUrl: receiptUrl,
      },
    });
  }
}

async function storeOrphanMessage(
  phoneNumber: string,
  body: string | null,
  messageSid: string,
  mediaUrl: string | null,
  mediaType: string | null,
) {
  // Store in activity log for manual review
  await prisma.activityLog.create({
    data: {
      action: "EMPTY_LEG_NOTIFICATION",
      targetType: "Unknown",
      targetId: "orphan",
      description: `Unmatched WhatsApp message from ${phoneNumber}`,
      ipAddress: "twilio-webhook",
      metadata: {
        phoneNumber,
        messageSid,
        body: body?.substring(0, 500),
        hasMedia: !!mediaUrl,
        mediaType,
      },
    },
  });
}

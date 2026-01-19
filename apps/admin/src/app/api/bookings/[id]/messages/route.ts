import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pexjet/database";
import {
  verifyAccessToken,
  extractTokenFromHeader,
  sendWhatsAppMessage,
} from "@pexjet/lib";

/**
 * GET /api/bookings/[id]/messages
 * Get all messages for a booking (CharterQuote or EmptyLegBooking)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const token = extractTokenFromHeader(request.headers.get("authorization"));
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = verifyAccessToken(token);
  if (!payload) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "empty_leg"; // "charter" or "empty_leg"

    let messages;

    if (type === "charter") {
      messages = await prisma.bookingMessage.findMany({
        where: { charterQuoteId: id },
        orderBy: { createdAt: "asc" },
      });
    } else {
      messages = await prisma.bookingMessage.findMany({
        where: { emptyLegBookingId: id },
        orderBy: { createdAt: "asc" },
      });
    }

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Failed to fetch messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/bookings/[id]/messages
 * Send a new message to client via WhatsApp
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const token = extractTokenFromHeader(request.headers.get("authorization"));
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = verifyAccessToken(token);
  if (!payload) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  try {
    const { id } = params;
    const body = await request.json();
    const { content, type = "empty_leg", mediaUrl } = body;

    if (!content && !mediaUrl) {
      return NextResponse.json(
        { error: "Message content or media is required" },
        { status: 400 },
      );
    }

    // Get booking details to find client phone
    let clientPhone: string | null = null;
    let referenceNumber: string | null = null;

    if (type === "charter") {
      const quote = await prisma.charterQuote.findUnique({
        where: { id },
        select: { clientPhone: true, referenceNumber: true },
      });
      clientPhone = quote?.clientPhone || null;
      referenceNumber = quote?.referenceNumber || null;
    } else {
      const booking = await prisma.emptyLegBooking.findUnique({
        where: { id },
        select: { clientPhone: true, referenceNumber: true },
      });
      clientPhone = booking?.clientPhone || null;
      referenceNumber = booking?.referenceNumber || null;
    }

    if (!clientPhone) {
      return NextResponse.json(
        { error: "Client phone number not found" },
        { status: 404 },
      );
    }

    // Send WhatsApp message
    const whatsappResult = await sendWhatsAppMessage({
      to: clientPhone,
      message: content || "",
      mediaUrl: mediaUrl || undefined,
    });

    if (!whatsappResult.success) {
      return NextResponse.json(
        { error: `Failed to send WhatsApp: ${whatsappResult.error}` },
        { status: 500 },
      );
    }

    // Store message in database
    const message = await prisma.bookingMessage.create({
      data: {
        ...(type === "charter"
          ? { charterQuoteId: id }
          : { emptyLegBookingId: id }),
        direction: "OUTBOUND",
        messageType: "FREEFORM",
        content,
        mediaUrl: mediaUrl || null,
        twilioMessageSid: whatsappResult.sid,
        status: "SENT",
        sentAt: new Date(),
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "EMPTY_LEG_NOTIFICATION",
        adminId: payload.sub,
        targetType: type === "charter" ? "CharterQuote" : "EmptyLegBooking",
        targetId: id,
        description: `Admin sent message to client for ${referenceNumber}`,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        metadata: {
          messageSid: whatsappResult.sid,
          hasMedia: !!mediaUrl,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message,
    });
  } catch (error) {
    console.error("Failed to send message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 },
    );
  }
}

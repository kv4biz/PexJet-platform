import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pexjet/database";
import {
  verifyAccessToken,
  extractTokenFromHeader,
  sendWhatsAppMessage,
  generateEmptyLegQuotePDF,
  uploadPDF,
} from "@pexjet/lib";

/**
 * POST /api/quotes/empty-leg/[id]/resend
 * Resend an empty leg quote with updated price
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
    const { totalPriceUsd } = body;

    if (!totalPriceUsd || isNaN(parseFloat(totalPriceUsd))) {
      return NextResponse.json(
        { error: "Valid price is required" },
        { status: 400 },
      );
    }

    // Get booking with related data
    const booking = await prisma.emptyLegBooking.findUnique({
      where: { id },
      include: {
        emptyLeg: {
          include: {
            departureAirport: {
              select: { name: true, municipality: true, icaoCode: true },
            },
            arrivalAirport: {
              select: { name: true, municipality: true, icaoCode: true },
            },
            aircraft: { select: { name: true, manufacturer: true } },
          },
        },
        client: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.status !== "APPROVED") {
      return NextResponse.json(
        { error: "Only approved bookings can be resent" },
        { status: 400 },
      );
    }

    // Update booking with new price and reset payment deadline
    const newPaymentDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const updatedBooking = await prisma.emptyLegBooking.update({
      where: { id },
      data: {
        totalPriceUsd: parseFloat(totalPriceUsd),
        paymentDeadline: newPaymentDeadline,
        receiptUrl: null, // Clear receipt if price changed
      },
    });

    // Format flight details
    const depCity =
      booking.emptyLeg.departureCity ||
      booking.emptyLeg.departureAirport?.municipality ||
      booking.emptyLeg.departureAirport?.name ||
      "Departure";
    const arrCity =
      booking.emptyLeg.arrivalCity ||
      booking.emptyLeg.arrivalAirport?.municipality ||
      booking.emptyLeg.arrivalAirport?.name ||
      "Arrival";
    const depCode =
      booking.emptyLeg.departureIcao ||
      booking.emptyLeg.departureAirport?.icaoCode ||
      "";
    const arrCode =
      booking.emptyLeg.arrivalIcao ||
      booking.emptyLeg.arrivalAirport?.icaoCode ||
      "";
    const aircraftName =
      booking.emptyLeg.aircraftName || booking.emptyLeg.aircraft?.name || "TBA";

    const flightDate = new Date(
      booking.emptyLeg.departureDateTime,
    ).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const flightTime = new Date(
      booking.emptyLeg.departureDateTime,
    ).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    // Generate new Quote PDF
    const pdfBuffer = await generateEmptyLegQuotePDF({
      referenceNumber: booking.referenceNumber,
      clientName: booking.clientName,
      clientEmail: booking.clientEmail,
      clientPhone: booking.clientPhone,
      departure: depCity,
      departureCode: depCode,
      arrival: arrCity,
      arrivalCode: arrCode,
      departureDateTime: `${flightDate} at ${flightTime}`,
      aircraft: aircraftName,
      seatsRequested: booking.seatsRequested,
      totalPrice: `$${parseFloat(totalPriceUsd).toLocaleString()} USD`,
      paymentDeadline: newPaymentDeadline.toLocaleString("en-US", {
        dateStyle: "full",
        timeStyle: "short",
      }),
      bankName: booking.bankName || "",
      bankAccountName: booking.bankAccountName || "",
      bankAccountNumber: booking.bankAccountNumber || "",
      bankSortCode: booking.bankSortCode || "",
    });

    // Upload PDF to Cloudinary
    const pdfUpload = await uploadPDF(pdfBuffer, {
      folder: "pexjet/quotes",
      publicId: `quote-${booking.referenceNumber}-v${Date.now()}`,
    });

    // Update booking with new quote document URL
    await prisma.emptyLegBooking.update({
      where: { id },
      data: { quoteDocumentUrl: pdfUpload.url },
    });

    // Send WhatsApp message with updated quote
    const whatsappMessage = `✈️ *UPDATED QUOTE - ${booking.referenceNumber}*

Dear ${booking.clientName},

We have updated your quote with the new agreed price.

*Flight Details:*
📍 Route: ${depCity} → ${arrCity}
📅 Date: ${flightDate}
🕐 Time: ${flightTime}
✈️ Aircraft: ${aircraftName}
👥 Seats: ${booking.seatsRequested}

*New Total Price: $${parseFloat(totalPriceUsd).toLocaleString()} USD*

Please find attached your updated Quote Confirmation document with bank transfer details.

⏰ Payment Deadline: ${newPaymentDeadline.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}

After payment, please send your payment receipt to this number.

Thank you for choosing PexJet!`;

    await sendWhatsAppMessage({
      to: booking.clientPhone,
      message: whatsappMessage,
      mediaUrl: pdfUpload.url,
    });

    // Store outbound message
    await prisma.bookingMessage.create({
      data: {
        emptyLegBookingId: id,
        direction: "OUTBOUND",
        messageType: "UTILITY",
        content: whatsappMessage,
        status: "SENT",
        sentAt: new Date(),
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "EMPTY_LEG_QUOTE_RESEND",
        adminId: payload.sub,
        targetType: "EmptyLegBooking",
        targetId: id,
        description: `Resent empty leg quote ${booking.referenceNumber} with new price $${totalPriceUsd}`,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        metadata: {
          totalPriceUsd,
          previousPrice: booking.totalPriceUsd,
          clientPhone: booking.clientPhone,
        },
      },
    });

    return NextResponse.json({
      success: true,
      booking: updatedBooking,
    });
  } catch (error) {
    console.error("Failed to resend empty leg quote:", error);
    return NextResponse.json(
      { error: "Failed to resend quote" },
      { status: 500 },
    );
  }
}

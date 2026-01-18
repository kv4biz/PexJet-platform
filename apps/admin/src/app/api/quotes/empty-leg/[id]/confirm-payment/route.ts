import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pexjet/database";
import {
  verifyAccessToken,
  extractTokenFromHeader,
  sendWhatsAppMessage,
  generateEmptyLegTicketPDF,
  uploadPDF,
} from "@pexjet/lib";

/**
 * POST /api/quotes/empty-leg/[id]/confirm-payment
 * Confirm payment received and send flight confirmation to client
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
        { error: "Only approved bookings can have payment confirmed" },
        { status: 400 },
      );
    }

    // Generate ticket number
    const settings = await prisma.settings.findUnique({
      where: { id: "default" },
    });

    const ticketCounter = (settings?.flightConfirmCounter || 0) + 1;
    const ticketNumber = `PEX-${new Date().getFullYear()}-${String(ticketCounter).padStart(6, "0")}`;

    // Update settings counter
    await prisma.settings.update({
      where: { id: "default" },
      data: { flightConfirmCounter: ticketCounter },
    });

    // Update booking
    const updatedBooking = await prisma.emptyLegBooking.update({
      where: { id },
      data: {
        status: "PAID",
        ticketNumber,
        confirmationSentAt: new Date(),
      },
    });

    // Create payment record in database
    const payment = await prisma.payment.create({
      data: {
        referenceNumber: `PAY-${booking.referenceNumber}`,
        clientId: booking.clientId,
        type: "EMPTY_LEG",
        emptyLegBookingId: id,
        status: "SUCCESS",
        amountUsd: booking.totalPriceUsd,
        method: "BANK_TRANSFER",
        bankTransferConfirmed: true,
        paidAt: new Date(),
        confirmedAt: new Date(),
        confirmedById: payload.sub,
        // Calculate commission split (90% to operator, 10% to admin by default)
        adminAmountUsd: booking.totalPriceUsd * 0.1,
        operatorAmountUsd: booking.totalPriceUsd * 0.9,
      },
    });

    // Format flight details
    const depCity =
      booking.emptyLeg.departureAirport?.municipality ||
      booking.emptyLeg.departureAirport?.name ||
      "Departure";
    const arrCity =
      booking.emptyLeg.arrivalAirport?.municipality ||
      booking.emptyLeg.arrivalAirport?.name ||
      "Arrival";
    const depCode = booking.emptyLeg.departureAirport?.icaoCode || "";
    const arrCode = booking.emptyLeg.arrivalAirport?.icaoCode || "";

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

    // Calculate check-in time (2 hours before departure)
    const checkInTime = new Date(booking.emptyLeg.departureDateTime);
    checkInTime.setHours(checkInTime.getHours() - 2);
    const checkInTimeStr = checkInTime.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    // Generate Ticket PDF
    const pdfBuffer = await generateEmptyLegTicketPDF({
      ticketNumber,
      referenceNumber: booking.referenceNumber,
      clientName: booking.clientName,
      clientEmail: booking.clientEmail,
      clientPhone: booking.clientPhone,
      departure: depCity,
      departureCode: depCode,
      arrival: arrCity,
      arrivalCode: arrCode,
      departureDateTime: `${flightDate} at ${flightTime}`,
      checkInTime: checkInTimeStr,
      aircraft: booking.emptyLeg.aircraft?.name || "TBA",
      seatsBooked: booking.seatsRequested,
      totalPaid: `$${booking.totalPriceUsd?.toLocaleString()} USD`,
      paidAt: new Date().toLocaleDateString("en-US", { dateStyle: "full" }),
    });

    // Upload PDF to Cloudinary
    const pdfUpload = await uploadPDF(pdfBuffer, {
      folder: "pexjet/tickets",
      publicId: `ticket-${ticketNumber}`,
    });

    // Update booking with flight document URL
    await prisma.emptyLegBooking.update({
      where: { id },
      data: { flightDocumentUrl: pdfUpload.url },
    });

    // Send flight confirmation via WhatsApp with PDF
    const whatsappMessage = `✅ *BOOKING CONFIRMED - ${booking.referenceNumber}*

Dear ${booking.clientName},

Your payment has been received and your flight is confirmed!

*🎫 Ticket Number: ${ticketNumber}*

✈️ *Route:* ${depCity} (${depCode}) → ${arrCity} (${arrCode})
📅 *Date:* ${flightDate}
🕐 *Departure:* ${flightTime}
⏰ *Check-in:* ${checkInTimeStr}

Please find attached your E-Ticket. Present this at check-in along with a valid ID.

For any questions, contact us at ${settings?.supportPhone || "our support line"}.

Thank you for flying with PexJet! ✈️`;

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
        action: "PAYMENT_SUCCESS",
        adminId: payload.sub,
        targetType: "EmptyLegBooking",
        targetId: id,
        description: `Confirmed payment for ${booking.referenceNumber}, ticket: ${ticketNumber}, payment: ${payment.referenceNumber}`,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        metadata: {
          ticketNumber,
          paymentReference: payment.referenceNumber,
          totalPriceUsd: booking.totalPriceUsd,
          clientPhone: booking.clientPhone,
        },
      },
    });

    return NextResponse.json({
      success: true,
      booking: updatedBooking,
      ticketNumber,
      paymentReference: payment.referenceNumber,
    });
  } catch (error) {
    console.error("Failed to confirm payment:", error);
    return NextResponse.json(
      { error: "Failed to confirm payment" },
      { status: 500 },
    );
  }
}

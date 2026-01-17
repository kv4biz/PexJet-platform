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
 * POST /api/quotes/empty-leg/[id]/approve
 * Approve an empty leg quote and send confirmation to client
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
    const {
      totalPriceUsd,
      clientName,
      clientEmail,
      clientPhone,
      seatsRequested,
      departureDateTime,
      paymentDeadline: paymentDeadlineStr,
      bankName,
      bankAccountName,
      bankAccountNumber,
      bankSortCode,
    } = body;

    if (!totalPriceUsd || isNaN(parseFloat(totalPriceUsd))) {
      return NextResponse.json(
        { error: "Valid price is required" },
        { status: 400 },
      );
    }

    if (!bankName || !bankAccountName || !bankAccountNumber) {
      return NextResponse.json(
        { error: "Bank details are required" },
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

    if (booking.status !== "PENDING") {
      return NextResponse.json(
        { error: "Only pending bookings can be approved" },
        { status: 400 },
      );
    }

    // Calculate payment deadline
    const paymentDeadline = paymentDeadlineStr
      ? new Date(paymentDeadlineStr)
      : new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Update booking with all editable fields
    const updatedBooking = await prisma.emptyLegBooking.update({
      where: { id },
      data: {
        status: "APPROVED",
        totalPriceUsd: parseFloat(totalPriceUsd),
        clientName: clientName || booking.clientName,
        clientEmail: clientEmail || booking.clientEmail,
        clientPhone: clientPhone || booking.clientPhone,
        seatsRequested: seatsRequested || booking.seatsRequested,
        approvedById: payload.sub,
        approvedAt: new Date(),
        paymentDeadline,
        paymentMethod: "BANK_TRANSFER",
        bankName,
        bankAccountName,
        bankAccountNumber,
        bankSortCode: bankSortCode || "",
      },
    });

    // Use updated client info for PDF and WhatsApp
    const finalClientName = clientName || booking.clientName;
    const finalClientEmail = clientEmail || booking.clientEmail;
    const finalClientPhone = clientPhone || booking.clientPhone;
    const finalSeatsRequested = seatsRequested || booking.seatsRequested;

    // Format flight details for WhatsApp message
    const depCity =
      booking.emptyLeg.departureAirport?.municipality ||
      booking.emptyLeg.departureAirport?.name ||
      "Departure";
    const arrCity =
      booking.emptyLeg.arrivalAirport?.municipality ||
      booking.emptyLeg.arrivalAirport?.name ||
      "Arrival";
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

    // Generate Quote PDF using form data
    const pdfBuffer = await generateEmptyLegQuotePDF({
      referenceNumber: booking.referenceNumber,
      clientName: finalClientName,
      clientEmail: finalClientEmail,
      clientPhone: finalClientPhone,
      departure: depCity,
      departureCode: booking.emptyLeg.departureAirport?.icaoCode || "",
      arrival: arrCity,
      arrivalCode: booking.emptyLeg.arrivalAirport?.icaoCode || "",
      departureDateTime: `${flightDate} at ${flightTime}`,
      aircraft: booking.emptyLeg.aircraft?.name || "TBA",
      seatsRequested: finalSeatsRequested,
      totalPrice: `$${parseFloat(totalPriceUsd).toLocaleString()} USD`,
      paymentDeadline: paymentDeadline.toLocaleString("en-US", {
        dateStyle: "full",
        timeStyle: "short",
      }),
      bankName,
      bankAccountName,
      bankAccountNumber,
      bankSortCode: bankSortCode || "",
    });

    // Upload PDF to Cloudinary
    const pdfUpload = await uploadPDF(pdfBuffer, {
      folder: "pexjet/quotes",
      publicId: `quote-${booking.referenceNumber}`,
    });

    // Update booking with quote document URL
    await prisma.emptyLegBooking.update({
      where: { id },
      data: { quoteDocumentUrl: pdfUpload.url },
    });

    // Send WhatsApp confirmation with PDF to client
    const whatsappMessage = `✈️ *QUOTE APPROVED - ${booking.referenceNumber}*

Dear ${finalClientName},

Your empty leg booking has been approved!

*Flight Details:*
📍 Route: ${depCity} → ${arrCity}
📅 Date: ${flightDate}
🕐 Time: ${flightTime}
✈️ Aircraft: ${booking.emptyLeg.aircraft?.name || "TBA"}
👥 Seats: ${finalSeatsRequested}

*Total Price: $${parseFloat(totalPriceUsd).toLocaleString()} USD*

Please find attached your Quote Confirmation document with bank transfer details.

⏰ Payment Deadline: ${paymentDeadline.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}

After payment, please send your payment receipt to this number.

Thank you for choosing PexJet!`;

    await sendWhatsAppMessage({
      to: finalClientPhone,
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
        action: "EMPTY_LEG_QUOTE_APPROVE",
        adminId: payload.sub,
        targetType: "EmptyLegBooking",
        targetId: id,
        description: `Approved empty leg quote ${booking.referenceNumber} for $${totalPriceUsd}`,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        metadata: {
          totalPriceUsd,
          clientPhone: booking.clientPhone,
        },
      },
    });

    return NextResponse.json({
      success: true,
      booking: updatedBooking,
    });
  } catch (error) {
    console.error("Failed to approve empty leg quote:", error);
    return NextResponse.json(
      { error: "Failed to approve quote" },
      { status: 500 },
    );
  }
}

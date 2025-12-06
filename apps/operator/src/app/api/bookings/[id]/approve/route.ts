import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pexjet/database";
import { verifyAuth, unauthorizedResponse } from "@/lib/auth";
import twilio from "twilio";

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN,
);

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const operator = await verifyAuth(request);
  if (!operator) return unauthorizedResponse();

  try {
    const { id } = params;

    // Find booking and verify ownership
    const booking = await prisma.emptyLegBooking.findUnique({
      where: { id },
      include: {
        emptyLeg: {
          include: {
            departureAirport: true,
            arrivalAirport: true,
            aircraft: true,
            createdByOperator: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.emptyLeg.createdByOperatorId !== operator.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (booking.status !== "PENDING") {
      return NextResponse.json(
        { error: "Booking is not pending" },
        { status: 400 },
      );
    }

    // Get settings for payment window
    const settings = await prisma.settings.findUnique({
      where: { id: "default" },
    });

    const paymentWindowHours = settings?.paymentWindowHours || 3;
    const paymentDeadline = new Date(
      Date.now() + paymentWindowHours * 60 * 60 * 1000,
    );

    // TODO: Generate Paystack payment link with split
    const paymentLink = `https://paystack.com/pay/${booking.referenceNumber}`;

    // Update booking
    const updatedBooking = await prisma.emptyLegBooking.update({
      where: { id },
      data: {
        status: "APPROVED",
        approvedAt: new Date(),
        paymentDeadline,
        paymentLink,
      },
    });

    // Send WhatsApp notification to client
    try {
      const message = `✅ *Booking Approved!*

Your empty leg booking has been approved.

*Reference:* ${booking.referenceNumber}
*Route:* ${booking.emptyLeg.departureAirport.iataCode || booking.emptyLeg.departureAirport.municipality} → ${booking.emptyLeg.arrivalAirport.iataCode || booking.emptyLeg.arrivalAirport.municipality}
*Aircraft:* ${booking.emptyLeg.aircraft.name}
*Seats:* ${booking.seatsRequested}
*Total:* ₦${booking.totalPriceNgn.toLocaleString()}

Please complete payment within ${paymentWindowHours} hours:
${paymentLink}

Thank you for choosing PexJet!`;

      await twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_WHATSAPP_NUMBER,
        to: `whatsapp:${booking.clientPhone}`,
      });
    } catch (twilioError) {
      console.error("Failed to send WhatsApp notification:", twilioError);
    }

    return NextResponse.json({
      message: "Booking approved",
      booking: updatedBooking,
    });
  } catch (error) {
    console.error("Booking approve error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

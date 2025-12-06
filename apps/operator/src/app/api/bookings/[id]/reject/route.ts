import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pexjet/database";
import { verifyAuth, unauthorizedResponse } from "@/lib/auth";
import twilio from "twilio";

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN,
);

const REJECTION_MESSAGES: Record<string, string> = {
  AIRCRAFT_UNAVAILABLE: "The aircraft is no longer available for this flight.",
  ROUTE_NOT_SERVICEABLE: "We are unable to service this route at this time.",
  INVALID_DATES: "The requested dates are not available.",
  PRICING_ISSUE: "There was an issue with the pricing.",
  CAPACITY_EXCEEDED: "The requested number of seats exceeds availability.",
  DEAL_NOT_AVAILABLE: "This deal is no longer available.",
  OTHER: "Your booking could not be processed at this time.",
};

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const operator = await verifyAuth(request);
  if (!operator) return unauthorizedResponse();

  try {
    const { id } = params;
    const { reason } = await request.json();

    // Find booking and verify ownership
    const booking = await prisma.emptyLegBooking.findUnique({
      where: { id },
      include: {
        emptyLeg: {
          include: {
            departureAirport: true,
            arrivalAirport: true,
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

    // Update booking
    const updatedBooking = await prisma.emptyLegBooking.update({
      where: { id },
      data: {
        status: "REJECTED",
        rejectionReason: reason || "OTHER",
      },
    });

    // Send WhatsApp notification to client
    try {
      const rejectionMessage =
        REJECTION_MESSAGES[reason] || REJECTION_MESSAGES.OTHER;

      const message = `❌ *Booking Update*

We regret to inform you that your empty leg booking could not be approved.

*Reference:* ${booking.referenceNumber}
*Route:* ${booking.emptyLeg.departureAirport.iataCode || booking.emptyLeg.departureAirport.municipality} → ${booking.emptyLeg.arrivalAirport.iataCode || booking.emptyLeg.arrivalAirport.municipality}

*Reason:* ${rejectionMessage}

We apologize for any inconvenience. Please browse our other available empty leg deals or contact us for alternative options.

Thank you for considering PexJet.`;

      await twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_WHATSAPP_NUMBER,
        to: `whatsapp:${booking.clientPhone}`,
      });
    } catch (twilioError) {
      console.error("Failed to send WhatsApp notification:", twilioError);
    }

    return NextResponse.json({
      message: "Booking rejected",
      booking: updatedBooking,
    });
  } catch (error) {
    console.error("Booking reject error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

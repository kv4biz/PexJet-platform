import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pexjet/database";
import {
  verifyAccessToken,
  extractTokenFromHeader,
  sendWhatsAppMessage,
} from "@pexjet/lib";

const REJECTION_MESSAGES: Record<string, string> = {
  AIRCRAFT_UNAVAILABLE: "the aircraft is no longer available for this route",
  ROUTE_NOT_SERVICEABLE: "we are unable to service this route at this time",
  INVALID_DATES: "the requested dates are not available",
  PRICING_ISSUE: "there is a pricing discrepancy that cannot be resolved",
  CAPACITY_EXCEEDED: "the requested number of seats exceeds availability",
  DEAL_NOT_AVAILABLE: "this empty leg deal is no longer available",
  NO_PAYMENT_MADE: "payment was not received within the required timeframe",
  OTHER: "we are unable to proceed with this booking at this time",
};

/**
 * POST /api/quotes/empty-leg/[id]/reject
 * Reject an empty leg quote and notify client
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
    const { rejectionReason, rejectionNote } = body;

    if (!rejectionReason) {
      return NextResponse.json(
        { error: "Rejection reason is required" },
        { status: 400 },
      );
    }

    // Get booking
    const booking = await prisma.emptyLegBooking.findUnique({
      where: { id },
      include: {
        emptyLeg: {
          include: {
            departureAirport: {
              select: { municipality: true, icaoCode: true },
            },
            arrivalAirport: { select: { municipality: true, icaoCode: true } },
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.status !== "PENDING") {
      return NextResponse.json(
        { error: "Only pending bookings can be rejected" },
        { status: 400 },
      );
    }

    // Update booking
    const updatedBooking = await prisma.emptyLegBooking.update({
      where: { id },
      data: {
        status: "REJECTED",
        rejectionReason: rejectionReason as any,
        rejectionNote,
      },
    });

    // Format rejection message
    const reasonText =
      REJECTION_MESSAGES[rejectionReason] || REJECTION_MESSAGES.OTHER;
    const depCity =
      booking.emptyLeg.departureAirport?.municipality ||
      booking.emptyLeg.departureAirport?.icaoCode;
    const arrCity =
      booking.emptyLeg.arrivalAirport?.municipality ||
      booking.emptyLeg.arrivalAirport?.icaoCode;

    let whatsappMessage = `Dear ${booking.clientName},

We regret to inform you that your empty leg booking request (${booking.referenceNumber}) for the ${depCity} → ${arrCity} route has been declined.

*Reason:* Unfortunately, ${reasonText}.`;

    if (rejectionNote) {
      whatsappMessage += `\n\n*Additional Information:* ${rejectionNote}`;
    }

    whatsappMessage += `\n\nWe apologize for any inconvenience. Please feel free to browse our other available empty leg deals or contact us for alternative options.

Thank you for your understanding.

- The PexJet Team`;

    // Send WhatsApp rejection message
    await sendWhatsAppMessage({
      to: booking.clientPhone,
      message: whatsappMessage,
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
        action: "EMPTY_LEG_QUOTE_REJECT",
        adminId: payload.sub,
        targetType: "EmptyLegBooking",
        targetId: id,
        description: `Rejected empty leg quote ${booking.referenceNumber}: ${rejectionReason}`,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        metadata: {
          rejectionReason,
          rejectionNote,
          clientPhone: booking.clientPhone,
        },
      },
    });

    return NextResponse.json({
      success: true,
      booking: updatedBooking,
    });
  } catch (error) {
    console.error("Failed to reject empty leg quote:", error);
    return NextResponse.json(
      { error: "Failed to reject quote" },
      { status: 500 },
    );
  }
}

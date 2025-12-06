import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pexjet/database";
import { verifyAccessToken, extractTokenFromHeader } from "@pexjet/lib";

export async function POST(
  request: NextRequest,
  { params }: { params: { bookingId: string } },
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

    const { bookingId } = await params;
    const body = await request.json();
    const { reason, note } = body;

    if (!reason) {
      return NextResponse.json(
        { error: "Rejection reason is required" },
        { status: 400 },
      );
    }

    // Get booking
    const booking = await prisma.emptyLegBooking.findUnique({
      where: { id: bookingId },
      include: {
        emptyLeg: {
          include: {
            departureAirport: true,
            arrivalAirport: true,
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
        { error: "Booking is not pending" },
        { status: 400 },
      );
    }

    // Update booking status
    const updatedBooking = await prisma.emptyLegBooking.update({
      where: { id: bookingId },
      data: {
        status: "REJECTED",
        rejectionReason: reason,
        rejectionNote: note || null,
      },
      include: {
        emptyLeg: {
          include: {
            departureAirport: true,
            arrivalAirport: true,
          },
        },
        client: true,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "EMPTY_LEG_QUOTE_REJECT",
        targetType: "EmptyLegBooking",
        targetId: booking.id,
        adminId: payload.sub,
        description: `Rejected empty leg booking ${booking.referenceNumber} for ${booking.clientName}`,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        metadata: {
          reason,
          note,
        },
      },
    });

    // TODO: Send WhatsApp notification to client with rejection reason
    // The message should include:
    // - Booking reference
    // - Route (departure -> arrival)
    // - Rejection reason
    // - Contact information for support

    return NextResponse.json({
      success: true,
      booking: updatedBooking,
      message: "Booking rejected successfully",
    });
  } catch (error: any) {
    console.error("Booking rejection error:", error);
    return NextResponse.json(
      { error: "Failed to reject booking" },
      { status: 500 },
    );
  }
}

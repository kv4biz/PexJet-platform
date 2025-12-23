import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pexjet/database";
import { verifyAccessToken, extractTokenFromHeader } from "@pexjet/lib";

// Helper to format currency
function formatNGN(amount: number): string {
  return `₦${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

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

    // Get booking with related data
    const booking = await prisma.emptyLegBooking.findUnique({
      where: { id: bookingId },
      include: {
        emptyLeg: {
          include: {
            aircraft: true,
            departureAirport: true,
            arrivalAirport: true,
            createdByOperator: true,
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
        { error: "Booking is not pending approval" },
        { status: 400 },
      );
    }

    // Check if enough seats available
    if (booking.emptyLeg.availableSeats < booking.seatsRequested) {
      return NextResponse.json(
        { error: "Not enough seats available" },
        { status: 400 },
      );
    }

    // Get settings for payment deadline (3 hours from now)
    const paymentDeadline = new Date(Date.now() + 3 * 60 * 60 * 1000);

    // Generate Paystack payment link
    let paymentLink = "";
    let paystackReference = "";

    try {
      // Get settings for admin cut percentage
      const settings = await prisma.settings.findUnique({
        where: { id: "default" },
      });
      const adminCutPercentage = settings?.defaultOperatorCommission || 10;

      // Calculate split amounts if operator created this empty leg
      const isOperatorDeal = !!booking.emptyLeg.createdByOperatorId;
      let operatorAmount = 0;
      let adminAmount = booking.totalPriceUsd;

      if (
        isOperatorDeal &&
        booking.emptyLeg.createdByOperator?.paystackSubaccountCode
      ) {
        adminAmount = (booking.totalPriceUsd * adminCutPercentage) / 100;
        operatorAmount = booking.totalPriceUsd - adminAmount;
      }

      // Create Paystack payment initialization
      paystackReference = `PEX-EL-${Date.now().toString(36).toUpperCase()}`;

      const paystackPayload: any = {
        email: booking.clientEmail,
        amount: Math.round(booking.totalPriceUsd * 100), // Paystack uses cents (USD)
        reference: paystackReference,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/callback`,
        metadata: {
          booking_id: booking.id,
          booking_type: "EMPTY_LEG",
          client_name: booking.clientName,
          client_phone: booking.clientPhone,
        },
      };

      // Add split payment if operator deal
      if (
        isOperatorDeal &&
        booking.emptyLeg.createdByOperator?.paystackSubaccountCode
      ) {
        paystackPayload.subaccount =
          booking.emptyLeg.createdByOperator.paystackSubaccountCode;
        paystackPayload.transaction_charge = Math.round(adminAmount * 100);
        paystackPayload.bearer = "account"; // Operator bears the Paystack fee
      }

      // Call Paystack API
      const paystackResponse = await fetch(
        "https://api.paystack.co/transaction/initialize",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(paystackPayload),
        },
      );

      if (paystackResponse.ok) {
        const paystackData = await paystackResponse.json();
        if (paystackData.status) {
          paymentLink = paystackData.data.authorization_url;
        }
      }
    } catch (paystackError) {
      console.error("Paystack error:", paystackError);
      // Continue without payment link - can be generated later
    }

    // Update booking status
    const updatedBooking = await prisma.emptyLegBooking.update({
      where: { id: bookingId },
      data: {
        status: "APPROVED",
        approvedById: payload.sub,
        approvedAt: new Date(),
        paymentDeadline,
        paymentLink: paymentLink || null,
      },
      include: {
        emptyLeg: {
          include: {
            aircraft: true,
            departureAirport: true,
            arrivalAirport: true,
          },
        },
        client: true,
      },
    });

    // Update available seats on empty leg
    await prisma.emptyLeg.update({
      where: { id: booking.emptyLegId },
      data: {
        availableSeats: {
          decrement: booking.seatsRequested,
        },
      },
    });

    // Create payment record if we have a payment link
    if (paymentLink && paystackReference) {
      await prisma.payment.create({
        data: {
          referenceNumber: `PEX-RC-${Date.now().toString(36).toUpperCase()}`,
          client: { connect: { id: booking.clientId } },
          type: "EMPTY_LEG",
          emptyLegBooking: { connect: { id: booking.id } },
          method: "PAYSTACK",
          amountUsd: booking.totalPriceUsd,
          paystackReference,
          status: "PENDING",
        },
      });
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "EMPTY_LEG_QUOTE_APPROVE",
        targetType: "EmptyLegBooking",
        targetId: booking.id,
        adminId: payload.sub,
        description: `Approved empty leg booking ${booking.referenceNumber} for ${booking.clientName}`,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        metadata: {
          seatsRequested: booking.seatsRequested,
          totalPriceUsd: booking.totalPriceUsd,
          paymentDeadline: paymentDeadline.toISOString(),
        },
      },
    });

    // TODO: Send WhatsApp notification with quote confirmation document
    // This would integrate with Twilio WhatsApp API
    // The message should include:
    // - Aircraft details
    // - Flight itinerary (departure -> arrival)
    // - Date and time
    // - Price
    // - Payment link with 3-hour deadline

    return NextResponse.json({
      success: true,
      booking: updatedBooking,
      paymentLink,
      paymentDeadline,
      message: "Booking approved successfully",
    });
  } catch (error: any) {
    console.error("Booking approval error:", error);
    return NextResponse.json(
      { error: "Failed to approve booking" },
      { status: 500 },
    );
  }
}

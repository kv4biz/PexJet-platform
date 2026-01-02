import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pexjet/database";
import { verifyAccessToken, extractTokenFromHeader } from "@pexjet/lib";

// POST - Reject charter quote
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
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

    const { id } = await params;
    const body = await request.json();
    const { rejectionReason, rejectionNote } = body;

    if (!rejectionReason) {
      return NextResponse.json(
        { error: "Rejection reason is required" },
        { status: 400 },
      );
    }

    // Find existing quote
    const existingQuote = await prisma.charterQuote.findUnique({
      where: { id },
      include: {
        client: { select: { phone: true, fullName: true } },
        legs: {
          include: {
            departureAirport: { select: { municipality: true, name: true } },
            arrivalAirport: { select: { municipality: true, name: true } },
          },
          orderBy: { legNumber: "asc" },
        },
      },
    });

    if (!existingQuote) {
      return NextResponse.json(
        { error: "Charter quote not found" },
        { status: 404 },
      );
    }

    // Only allow rejecting PENDING quotes
    if (existingQuote.status !== "PENDING") {
      return NextResponse.json(
        { error: "Can only reject pending quotes" },
        { status: 400 },
      );
    }

    // Update quote to rejected
    const updatedQuote = await prisma.$transaction(async (tx) => {
      const quote = await tx.charterQuote.update({
        where: { id },
        data: {
          status: "REJECTED",
          rejectionReason,
          rejectionNote: rejectionNote || null,
        },
        include: {
          client: {
            select: { id: true, fullName: true, phone: true, email: true },
          },
          legs: {
            include: {
              departureAirport: { select: { name: true, municipality: true } },
              arrivalAirport: { select: { name: true, municipality: true } },
            },
            orderBy: { legNumber: "asc" },
          },
        },
      });

      // Log activity
      await tx.activityLog.create({
        data: {
          action: "CHARTER_QUOTE_REJECT",
          targetType: "CharterQuote",
          targetId: id,
          adminId: payload.sub,
          description: `Rejected charter quote ${existingQuote.referenceNumber}: ${rejectionReason}`,
          ipAddress: request.headers.get("x-forwarded-for") || "unknown",
          metadata: { rejectionReason, rejectionNote },
        },
      });

      return quote;
    });

    // TODO: Send WhatsApp notification to client
    // Format rejection message based on reason
    const rejectionMessages: Record<string, string> = {
      AIRCRAFT_UNAVAILABLE:
        "The requested aircraft is not available for your dates.",
      ROUTE_NOT_SERVICEABLE:
        "We are unable to service the requested route at this time.",
      INVALID_DATES: "The requested dates are not available.",
      PRICING_ISSUE: "There is a pricing issue with your request.",
      CAPACITY_EXCEEDED: "The passenger count exceeds available capacity.",
      OTHER:
        rejectionNote || "Your request could not be accommodated at this time.",
    };

    const clientMessage = `Dear ${existingQuote.client.fullName},

We regret to inform you that your charter quote request (${existingQuote.referenceNumber}) has been declined.

Reason: ${rejectionMessages[rejectionReason] || rejectionNote || "Request could not be accommodated."}

Please feel free to submit a new request or contact us for assistance.

Best regards,
PexJet Team`;

    // TODO: Implement WhatsApp sending via Twilio
    // await sendWhatsAppMessage(existingQuote.client.phone, clientMessage);

    return NextResponse.json({
      success: true,
      quote: updatedQuote,
      message: "Quote rejected successfully",
    });
  } catch (error: any) {
    console.error("Failed to reject charter quote:", error);
    return NextResponse.json(
      { error: error.message || "Failed to reject charter quote" },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pexjet/database";
import { verifyAccessToken, extractTokenFromHeader } from "@pexjet/lib";

// POST - Approve charter quote
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
    const {
      totalPriceUsd,
      legs, // Array with leg updates (aircraftId, priceUsd per leg)
      paymentDeadlineHours = 72, // Default 72 hours (3 days) for bank transfer
    } = body;

    if (!totalPriceUsd || totalPriceUsd <= 0) {
      return NextResponse.json(
        { error: "Total price is required" },
        { status: 400 },
      );
    }

    // Find existing quote
    const existingQuote = await prisma.charterQuote.findUnique({
      where: { id },
      include: {
        client: { select: { phone: true, fullName: true, email: true } },
        legs: {
          include: {
            departureAirport: {
              select: {
                id: true,
                municipality: true,
                name: true,
                iataCode: true,
              },
            },
            arrivalAirport: {
              select: {
                id: true,
                municipality: true,
                name: true,
                iataCode: true,
              },
            },
          },
          orderBy: { legNumber: "asc" },
        },
        selectedAircraft: {
          include: {
            aircraft: { select: { id: true, name: true, manufacturer: true } },
          },
        },
      },
    });

    if (!existingQuote) {
      return NextResponse.json(
        { error: "Charter quote not found" },
        { status: 404 },
      );
    }

    // Only allow approving PENDING quotes
    if (existingQuote.status !== "PENDING") {
      return NextResponse.json(
        { error: "Can only approve pending quotes" },
        { status: 400 },
      );
    }

    // Calculate payment deadline
    const paymentDeadline = new Date();
    paymentDeadline.setHours(paymentDeadline.getHours() + paymentDeadlineHours);

    // Update quote and legs in transaction
    const updatedQuote = await prisma.$transaction(async (tx) => {
      // Update legs if provided (assign aircraft and prices per leg)
      if (legs && Array.isArray(legs)) {
        for (const leg of legs) {
          if (!leg.id) continue;

          const legUpdate: any = {};
          if (leg.aircraftId) legUpdate.aircraftId = leg.aircraftId;
          if (leg.priceUsd !== undefined)
            legUpdate.priceUsd = parseFloat(leg.priceUsd);
          if (leg.departureDateTime)
            legUpdate.departureDateTime = new Date(leg.departureDateTime);
          if (leg.departureAirportId)
            legUpdate.departureAirportId = leg.departureAirportId;
          if (leg.arrivalAirportId)
            legUpdate.arrivalAirportId = leg.arrivalAirportId;

          await tx.charterLeg.update({
            where: { id: leg.id },
            data: legUpdate,
          });
        }
      }

      // Update quote to approved
      const quote = await tx.charterQuote.update({
        where: { id },
        data: {
          status: "APPROVED",
          totalPriceUsd: parseFloat(totalPriceUsd),
          approvedById: payload.sub,
          approvedAt: new Date(),
          paymentMethod: "BANK_TRANSFER", // Default to bank transfer
          paymentDeadline,
          // Document URLs will be set after generation
          quoteDocumentUrl: null,
          invoiceDocumentUrl: null,
        },
        include: {
          client: {
            select: { id: true, fullName: true, phone: true, email: true },
          },
          legs: {
            include: {
              departureAirport: {
                select: {
                  id: true,
                  name: true,
                  municipality: true,
                  iataCode: true,
                  icaoCode: true,
                },
              },
              arrivalAirport: {
                select: {
                  id: true,
                  name: true,
                  municipality: true,
                  iataCode: true,
                  icaoCode: true,
                },
              },
              aircraft: {
                select: {
                  id: true,
                  name: true,
                  manufacturer: true,
                },
              },
            },
            orderBy: { legNumber: "asc" },
          },
          selectedAircraft: {
            include: {
              aircraft: {
                select: { id: true, name: true, manufacturer: true },
              },
            },
          },
          approvedBy: { select: { id: true, fullName: true } },
        },
      });

      // Log activity
      await tx.activityLog.create({
        data: {
          action: "CHARTER_QUOTE_APPROVE",
          targetType: "CharterQuote",
          targetId: id,
          adminId: payload.sub,
          description: `Approved charter quote ${existingQuote.referenceNumber} for $${totalPriceUsd}`,
          ipAddress: request.headers.get("x-forwarded-for") || "unknown",
          metadata: { totalPriceUsd, paymentDeadline, legs },
        },
      });

      return quote;
    });

    // TODO: Generate Quote Document + Invoice PDF
    // const quoteDocUrl = await generateQuoteDocument(updatedQuote);
    // const invoiceDocUrl = await generateInvoiceDocument(updatedQuote);

    // TODO: Send WhatsApp notification to client with documents
    // Build approval message with bank details
    const formattedLegs = updatedQuote.legs
      .map((leg, index) => {
        const dep =
          leg.departureAirport.municipality || leg.departureAirport.name;
        const arr = leg.arrivalAirport.municipality || leg.arrivalAirport.name;
        // Format date/time using UTC methods (stored as UTC representing local time)
        const d = new Date(leg.departureDateTime);
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const months = [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ];
        const date = `${days[d.getUTCDay()]}, ${months[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
        const time = `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")} LT`;
        const aircraft = leg.aircraft?.name || "TBA";
        const price = leg.priceUsd
          ? `$${leg.priceUsd.toLocaleString()}`
          : "Included";
        return `Leg ${index + 1}: ${dep} → ${arr}\n  Date: ${date} at ${time}\n  Aircraft: ${aircraft}\n  Price: ${price}`;
      })
      .join("\n\n");

    const clientMessage = `Dear ${existingQuote.client.fullName},

Great news! Your charter quote request (${existingQuote.referenceNumber}) has been approved.

FLIGHT DETAILS:
${formattedLegs}

TOTAL PRICE: $${parseFloat(totalPriceUsd).toLocaleString()} USD

PAYMENT DETAILS:
Please make payment via bank transfer to:
Bank: [BANK NAME]
Account Name: PexJet Aviation Ltd
Account Number: [ACCOUNT NUMBER]
Sort Code: [SORT CODE]

Payment Deadline: ${paymentDeadline.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })}

After payment, please send your payment receipt to this WhatsApp number for confirmation.

Best regards,
PexJet Team`;

    // TODO: Implement WhatsApp sending via Twilio
    // await sendWhatsAppMessage(existingQuote.client.phone, clientMessage);
    // await sendWhatsAppDocument(existingQuote.client.phone, quoteDocUrl, "Quote Document");
    // await sendWhatsAppDocument(existingQuote.client.phone, invoiceDocUrl, "Invoice");

    return NextResponse.json({
      success: true,
      quote: updatedQuote,
      message: "Quote approved successfully",
      clientNotification: clientMessage, // For debugging/preview
    });
  } catch (error: any) {
    console.error("Failed to approve charter quote:", error);
    return NextResponse.json(
      { error: error.message || "Failed to approve charter quote" },
      { status: 500 },
    );
  }
}

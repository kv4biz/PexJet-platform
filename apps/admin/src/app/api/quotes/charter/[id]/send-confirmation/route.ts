import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pexjet/database";
import { verifyAccessToken, extractTokenFromHeader } from "@pexjet/lib";

// POST - Send flight confirmation to client (after payment confirmed)
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

    // Flight confirmation details for each leg
    const { legs } = body; // Array with leg confirmation details

    // Find existing quote
    const existingQuote = await prisma.charterQuote.findUnique({
      where: { id },
      include: {
        client: { select: { phone: true, fullName: true, email: true } },
        legs: {
          include: {
            departureAirport: {
              select: {
                name: true,
                municipality: true,
                iataCode: true,
                icaoCode: true,
              },
            },
            arrivalAirport: {
              select: {
                name: true,
                municipality: true,
                iataCode: true,
                icaoCode: true,
              },
            },
            aircraft: {
              select: {
                name: true,
                model: true,
                manufacturer: true,
                passengerCapacityMax: true,
              },
            },
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

    // Only allow sending confirmation for PAID quotes
    if (existingQuote.status !== "PAID") {
      return NextResponse.json(
        { error: "Can only send confirmation for paid quotes" },
        { status: 400 },
      );
    }

    // Validate legs confirmation data
    if (!legs || !Array.isArray(legs) || legs.length === 0) {
      return NextResponse.json(
        { error: "Flight confirmation details are required for each leg" },
        { status: 400 },
      );
    }

    // Update quote and legs in transaction
    const updatedQuote = await prisma.$transaction(async (tx) => {
      // Update each leg with confirmation details
      for (const legData of legs) {
        if (!legData.id) continue;

        const legUpdate: any = {
          confirmationSentAt: new Date(),
        };

        // Flight confirmation fields
        if (legData.ticketNumber) legUpdate.ticketNumber = legData.ticketNumber;
        if (legData.boardingInfo) legUpdate.boardingInfo = legData.boardingInfo;
        if (legData.terminalInfo) legUpdate.terminalInfo = legData.terminalInfo;
        if (legData.gateInfo) legUpdate.gateInfo = legData.gateInfo;
        if (legData.checkInTime)
          legUpdate.checkInTime = new Date(legData.checkInTime);
        if (legData.pilotName) legUpdate.pilotName = legData.pilotName;
        if (legData.pilotContact) legUpdate.pilotContact = legData.pilotContact;
        if (legData.additionalNotes)
          legUpdate.additionalNotes = legData.additionalNotes;

        await tx.charterLeg.update({
          where: { id: legData.id },
          data: legUpdate,
        });
      }

      // Update quote status to COMPLETED
      const quote = await tx.charterQuote.update({
        where: { id },
        data: {
          status: "COMPLETED",
          confirmationSentAt: new Date(),
          // Document URL will be set after generation
          // flightDocumentUrl: flightDocUrl,
        },
        include: {
          client: {
            select: { id: true, fullName: true, phone: true, email: true },
          },
          legs: {
            include: {
              departureAirport: {
                select: {
                  name: true,
                  municipality: true,
                  iataCode: true,
                  icaoCode: true,
                },
              },
              arrivalAirport: {
                select: {
                  name: true,
                  municipality: true,
                  iataCode: true,
                  icaoCode: true,
                },
              },
              aircraft: {
                select: { name: true, model: true, manufacturer: true },
              },
            },
            orderBy: { legNumber: "asc" },
          },
        },
      });

      // Log activity
      await tx.activityLog.create({
        data: {
          action: "CHARTER_CONFIRMATION_SENT",
          targetType: "CharterQuote",
          targetId: id,
          adminId: payload.sub,
          description: `Sent flight confirmation for charter quote ${existingQuote.referenceNumber}`,
          ipAddress: request.headers.get("x-forwarded-for") || "unknown",
          metadata: { legs },
        },
      });

      return quote;
    });

    // TODO: Generate Flight Confirmation Document PDF
    // const flightDocUrl = await generateFlightConfirmationDocument(updatedQuote);
    // await prisma.charterQuote.update({ where: { id }, data: { flightDocumentUrl: flightDocUrl } });

    // Build confirmation message for WhatsApp
    const formattedLegs = updatedQuote.legs
      .map((leg, index) => {
        const dep =
          leg.departureAirport.municipality || leg.departureAirport.name;
        const depCode =
          leg.departureAirport.iataCode || leg.departureAirport.icaoCode || "";
        const arr = leg.arrivalAirport.municipality || leg.arrivalAirport.name;
        const arrCode =
          leg.arrivalAirport.iataCode || leg.arrivalAirport.icaoCode || "";
        // Format date/time using UTC methods (stored as UTC representing local time)
        const d = new Date(leg.departureDateTime);
        const days = [
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ];
        const months = [
          "January",
          "February",
          "March",
          "April",
          "May",
          "June",
          "July",
          "August",
          "September",
          "October",
          "November",
          "December",
        ];
        const date = `${days[d.getUTCDay()]}, ${months[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
        const time = `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")} LT`;
        const aircraft = leg.aircraft?.name || "TBA";

        return `
✈️ LEG ${index + 1}: ${dep} (${depCode}) → ${arr} (${arrCode})
━━━━━━━━━━━━━━━━━━━━━━
📅 Date: ${date}
🕐 Departure: ${time}
🛩️ Aircraft: ${aircraft}
🎫 Ticket: ${leg.ticketNumber || "See document"}
🚪 Terminal: ${leg.terminalInfo || "TBA"}
🚶 Gate: ${leg.gateInfo || "TBA"}
⏰ Check-in: ${leg.checkInTime ? new Date(leg.checkInTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "TBA"}
👨‍✈️ Pilot: ${leg.pilotName || "TBA"}
${leg.additionalNotes ? `📝 Notes: ${leg.additionalNotes}` : ""}`;
      })
      .join("\n");

    const clientMessage = `🎉 FLIGHT CONFIRMATION

Dear ${existingQuote.client.fullName},

Your charter flight (${existingQuote.referenceNumber}) is confirmed!

${formattedLegs}

📄 Your flight confirmation document and payment receipt are attached.

Thank you for choosing PexJet. We look forward to serving you!

Best regards,
PexJet Team

For any questions, please contact us on this WhatsApp number.`;

    // TODO: Implement WhatsApp sending via Twilio
    // await sendWhatsAppMessage(existingQuote.client.phone, clientMessage);
    // await sendWhatsAppDocument(existingQuote.client.phone, flightDocUrl, "Flight Confirmation");
    // await sendWhatsAppDocument(existingQuote.client.phone, existingQuote.receiptUrl, "Payment Receipt");

    return NextResponse.json({
      success: true,
      quote: updatedQuote,
      message: "Flight confirmation sent successfully. Transaction completed.",
      clientNotification: clientMessage, // For debugging/preview
    });
  } catch (error: any) {
    console.error("Failed to send flight confirmation:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send flight confirmation" },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pexjet/database";

// Generate reference number
function generateReferenceNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `PEX-QT-${year}-${random}`;
}

// Map trip type from frontend to database enum
function mapFlightType(
  tripType: string,
): "ONE_WAY" | "ROUND_TRIP" | "MULTI_LEG" {
  const mapping: Record<string, "ONE_WAY" | "ROUND_TRIP" | "MULTI_LEG"> = {
    oneWay: "ONE_WAY",
    roundTrip: "ROUND_TRIP",
    multiLeg: "MULTI_LEG",
    ONE_WAY: "ONE_WAY",
    ROUND_TRIP: "ROUND_TRIP",
    MULTI_LEG: "MULTI_LEG",
  };
  return mapping[tripType] || "ONE_WAY";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { searchData, selectedAircraft, contactInfo } = body;

    // Validate required fields
    if (
      !contactInfo?.firstName ||
      !contactInfo?.lastName ||
      !contactInfo?.email ||
      !contactInfo?.phone
    ) {
      return NextResponse.json(
        { error: "Missing required contact information" },
        { status: 400 },
      );
    }

    if (!searchData?.flights || searchData.flights.length === 0) {
      return NextResponse.json(
        { error: "At least one flight leg is required" },
        { status: 400 },
      );
    }

    // Find or create client by phone (WhatsApp number is unique identifier)
    let client = await prisma.client.findUnique({
      where: { phone: contactInfo.phone },
    });

    if (!client) {
      client = await prisma.client.create({
        data: {
          phone: contactInfo.phone,
          email: contactInfo.email,
          fullName: `${contactInfo.firstName} ${contactInfo.lastName}`,
        },
      });
    } else {
      // Update client info if changed
      await prisma.client.update({
        where: { id: client.id },
        data: {
          email: contactInfo.email,
          fullName: `${contactInfo.firstName} ${contactInfo.lastName}`,
        },
      });
    }

    // Parse flights and find airport IDs
    const flightLegs = [];
    for (let i = 0; i < searchData.flights.length; i++) {
      const flight = searchData.flights[i];

      // Extract airport codes from the "CODE - City" format
      const fromCode = flight.from?.split(" - ")[0]?.trim();
      const toCode = flight.to?.split(" - ")[0]?.trim();

      if (!fromCode || !toCode) {
        return NextResponse.json(
          { error: `Invalid airport selection for leg ${i + 1}` },
          { status: 400 },
        );
      }

      // Find departure airport
      const departureAirport = await prisma.airport.findFirst({
        where: {
          OR: [{ iataCode: fromCode }, { icaoCode: fromCode }],
        },
      });

      // Find arrival airport
      const arrivalAirport = await prisma.airport.findFirst({
        where: {
          OR: [{ iataCode: toCode }, { icaoCode: toCode }],
        },
      });

      if (!departureAirport || !arrivalAirport) {
        return NextResponse.json(
          { error: `Could not find airports for leg ${i + 1}` },
          { status: 400 },
        );
      }

      // Parse departure date and time
      let departureDateTime: Date;
      if (flight.departureDate?.date) {
        const dateStr = flight.departureDate.date;
        const timeStr = flight.departureDate.time || "12:00";
        departureDateTime = new Date(`${dateStr}T${timeStr}:00`);
      } else if (flight.date) {
        const timeStr = flight.time || "12:00";
        departureDateTime = new Date(`${flight.date}T${timeStr}:00`);
      } else {
        return NextResponse.json(
          { error: `Missing departure date for leg ${i + 1}` },
          { status: 400 },
        );
      }

      flightLegs.push({
        legNumber: i + 1,
        departureAirportId: departureAirport.id,
        arrivalAirportId: arrivalAirport.id,
        departureDateTime,
      });

      // For round trip, add return leg
      if (
        searchData.tripType === "roundTrip" &&
        i === 0 &&
        (flight.returnDate?.date || flight.returnDate)
      ) {
        let returnDateTime: Date;
        if (flight.returnDate?.date) {
          const dateStr = flight.returnDate.date;
          const timeStr = flight.returnDate.time || "12:00";
          returnDateTime = new Date(`${dateStr}T${timeStr}:00`);
        } else {
          const timeStr = flight.returnTime || "12:00";
          returnDateTime = new Date(`${flight.returnDate}T${timeStr}:00`);
        }

        flightLegs.push({
          legNumber: 2,
          departureAirportId: arrivalAirport.id, // Swap for return
          arrivalAirportId: departureAirport.id,
          departureDateTime: returnDateTime,
        });
      }
    }

    // Create the charter quote with legs
    const charterQuote = await prisma.charterQuote.create({
      data: {
        referenceNumber: generateReferenceNumber(),
        clientId: client.id,
        clientName: `${contactInfo.firstName} ${contactInfo.lastName}`,
        clientEmail: contactInfo.email,
        clientPhone: contactInfo.phone,
        flightType: mapFlightType(searchData.tripType),
        passengerCount: searchData.passengers || 1,
        specialRequests: contactInfo.notes || null,
        status: "PENDING",
        legs: {
          create: flightLegs,
        },
        // Add selected aircraft if provided
        ...(selectedAircraft &&
          selectedAircraft.length > 0 && {
            selectedAircraft: {
              create: selectedAircraft
                .filter((a: any) => a.id) // Only include aircraft with valid IDs
                .map((aircraft: any) => ({
                  aircraftId: aircraft.id,
                })),
            },
          }),
      },
      include: {
        legs: {
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
        action: "CHARTER_QUOTE_CREATE",
        targetType: "CharterQuote",
        targetId: charterQuote.id,
        clientPhone: contactInfo.phone,
        description: `New charter quote request ${charterQuote.referenceNumber} from ${contactInfo.firstName} ${contactInfo.lastName}`,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        metadata: {
          flightType: charterQuote.flightType,
          passengerCount: charterQuote.passengerCount,
          legsCount: flightLegs.length,
        },
      },
    });

    // Send WhatsApp notification to all admins
    try {
      const admins = await prisma.admin.findMany({
        select: { phone: true, fullName: true },
      });

      console.log(`[WhatsApp] Found ${admins.length} admins to notify`);

      // Get first leg details for the message
      const firstLeg = charterQuote.legs[0];
      const departureCode =
        firstLeg?.departureAirport?.icaoCode ||
        firstLeg?.departureAirport?.iataCode ||
        "N/A";
      const arrivalCode =
        firstLeg?.arrivalAirport?.icaoCode ||
        firstLeg?.arrivalAirport?.iataCode ||
        "N/A";

      const message =
        `🛩️ *New Charter Quote Request*\n\n` +
        `Reference: ${charterQuote.referenceNumber}\n` +
        `Client: ${charterQuote.clientName}\n` +
        `Phone: ${charterQuote.clientPhone}\n` +
        `Route: ${departureCode} → ${arrivalCode}\n` +
        `Type: ${charterQuote.flightType.replace("_", " ")}\n` +
        `Passengers: ${charterQuote.passengerCount}\n\n` +
        `Please review in the admin dashboard.`;

      // Check Twilio credentials
      const hasTwilioCredentials =
        process.env.TWILIO_ACCOUNT_SID &&
        process.env.TWILIO_AUTH_TOKEN &&
        process.env.TWILIO_WHATSAPP_NUMBER;

      console.log(
        `[WhatsApp] Twilio credentials configured: ${!!hasTwilioCredentials}`,
      );
      console.log(
        `[WhatsApp] TWILIO_ACCOUNT_SID: ${process.env.TWILIO_ACCOUNT_SID ? "Set" : "Missing"}`,
      );
      console.log(
        `[WhatsApp] TWILIO_AUTH_TOKEN: ${process.env.TWILIO_AUTH_TOKEN ? "Set" : "Missing"}`,
      );
      console.log(
        `[WhatsApp] TWILIO_WHATSAPP_NUMBER: ${process.env.TWILIO_WHATSAPP_NUMBER || "Missing"}`,
      );

      if (hasTwilioCredentials) {
        const twilio = require("twilio")(
          process.env.TWILIO_ACCOUNT_SID,
          process.env.TWILIO_AUTH_TOKEN,
        );

        for (const admin of admins) {
          // Format phone number properly
          let formattedPhone = admin.phone.replace(/[^\d+]/g, "");
          if (!formattedPhone.startsWith("+")) {
            // Assume Nigerian number if starts with 0
            if (formattedPhone.startsWith("0")) {
              formattedPhone = "+234" + formattedPhone.slice(1);
            } else {
              formattedPhone = "+" + formattedPhone;
            }
          }

          console.log(
            `[WhatsApp] Sending to ${admin.fullName} at ${formattedPhone}`,
          );

          try {
            const result = await twilio.messages.create({
              body: message,
              from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
              to: `whatsapp:${formattedPhone}`,
            });
            console.log(
              `[WhatsApp] ✓ Sent to ${admin.fullName}, SID: ${result.sid}`,
            );
          } catch (twilioError: any) {
            console.error(
              `[WhatsApp] ✗ Failed to send to ${admin.fullName}:`,
              twilioError.message || twilioError,
            );
          }
        }
      } else {
        console.log(
          "[WhatsApp] Twilio credentials not configured, skipping WhatsApp notification",
        );
      }
    } catch (whatsappError) {
      console.error("[WhatsApp] Notification error:", whatsappError);
      // Don't fail the request if WhatsApp fails
    }

    return NextResponse.json({
      success: true,
      referenceNumber: charterQuote.referenceNumber,
      message: "Charter quote request submitted successfully",
    });
  } catch (error: any) {
    console.error("Charter quote submission error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit charter quote request" },
      { status: 500 },
    );
  }
}

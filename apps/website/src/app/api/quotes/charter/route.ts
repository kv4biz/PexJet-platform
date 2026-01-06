import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pexjet/database";

// Generate reference number
function generateReferenceNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `PEX-QT-${year}-${random}`;
}

// Map region/country to IANA timezone
function getTimezoneFromRegion(
  regionCode: string,
  countryCode: string,
): string {
  // Common timezone mappings by country
  const countryTimezones: Record<string, string> = {
    US: "America/New_York",
    CA: "America/Toronto",
    GB: "Europe/London",
    NG: "Africa/Lagos",
    ZA: "Africa/Johannesburg",
    AE: "Asia/Dubai",
    SG: "Asia/Singapore",
    AU: "Australia/Sydney",
    DE: "Europe/Berlin",
    FR: "Europe/Paris",
    IT: "Europe/Rome",
    ES: "Europe/Madrid",
    BR: "America/Sao_Paulo",
    MX: "America/Mexico_City",
    JP: "Asia/Tokyo",
    CN: "Asia/Shanghai",
    IN: "Asia/Kolkata",
    KE: "Africa/Nairobi",
    EG: "Africa/Cairo",
    GH: "Africa/Accra",
  };

  // US region-specific timezones
  if (countryCode === "US") {
    const usRegionTimezones: Record<string, string> = {
      "US-CA": "America/Los_Angeles",
      "US-WA": "America/Los_Angeles",
      "US-OR": "America/Los_Angeles",
      "US-NV": "America/Los_Angeles",
      "US-AZ": "America/Phoenix",
      "US-CO": "America/Denver",
      "US-TX": "America/Chicago",
      "US-IL": "America/Chicago",
      "US-NY": "America/New_York",
      "US-FL": "America/New_York",
      "US-GA": "America/New_York",
      "US-NJ": "America/New_York",
      "US-MA": "America/New_York",
    };
    return usRegionTimezones[regionCode] || "America/New_York";
  }

  return countryTimezones[countryCode] || "UTC";
}

// Format airport name for InstaCharter (e.g., "Lagos (DNMM)")
function formatAirportName(airport: any): string {
  const code = airport.icaoCode || airport.iataCode || airport.ident;
  const name = airport.municipality || airport.name;
  return `${name} (${code})`;
}

// Send request to InstaCharter API
async function sendToInstaCharter(
  payload: any,
): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.INSTACHARTER_API_KEY;
  const ownerId = process.env.INSTACHARTER_OWNER_ID;

  if (!apiKey || !ownerId) {
    console.log("[InstaCharter] API credentials not configured, skipping");
    return { success: false, error: "InstaCharter credentials not configured" };
  }

  try {
    const response = await fetch(
      "https://server.instacharter.app/api/Markets/Sendrequest",
      {
        method: "POST",
        headers: {
          accept: "*/*",
          "X-Api-Key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          owner: { id: ownerId },
          ...payload,
        }),
      },
    );

    const data = await response.json();

    if (data.success) {
      console.log("[InstaCharter] ✓ Request sent successfully");
      return { success: true };
    } else {
      console.error("[InstaCharter] ✗ API error:", data.message);
      return { success: false, error: data.message };
    }
  } catch (error: any) {
    console.error("[InstaCharter] ✗ Request failed:", error.message);
    return { success: false, error: error.message };
  }
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

// Build customer message with selected categories info
function buildCustomerMessage(
  contactInfo: any,
  charterQuote: any,
  selectedCategories: any[] | undefined,
): string {
  let message = contactInfo.notes || "";

  // Add reference number
  message += `\n\nCharter Quote Request - Ref: ${charterQuote.referenceNumber}`;

  // Add selected categories with prices
  if (selectedCategories && selectedCategories.length > 0) {
    message += "\n\nSelected Aircraft Categories:";
    selectedCategories.forEach((cat: any) => {
      message += `\n- ${cat.category}: ${cat.priceFormatted || `$${cat.price?.toLocaleString()}`}`;
      if (cat.flightTimeFormatted || cat.flightTime) {
        message += ` (${cat.flightTimeFormatted || cat.flightTime})`;
      }
    });
  }

  return message.trim();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Extract selectedCategories (InstaCharter format), selectedAircraft (legacy), and contactInfo
    const { selectedCategories, selectedAircraft, contactInfo, ...searchData } =
      body;

    console.log("[Charter API] Received body:", JSON.stringify(body, null, 2));
    console.log(
      "[Charter API] Extracted searchData:",
      JSON.stringify(searchData, null, 2),
    );

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

    // Get flights array - either from flights field or construct from individual fields
    let flights = searchData?.flights;
    if (!flights || flights.length === 0) {
      // Construct flights from individual fields (legacy/simple format)
      if (searchData?.departureAirport || searchData?.from) {
        flights = [
          {
            id: "1",
            from: searchData.departureAirport || searchData.from,
            to: searchData.destinationAirport || searchData.to,
            date: searchData.departureDate || searchData.date,
            time: searchData.departureTime || searchData.time || "12:00",
            returnDate: searchData.returnDate,
            returnTime: searchData.returnTime,
          },
        ];
      }
    }

    if (!flights || flights.length === 0) {
      return NextResponse.json(
        { error: "At least one flight leg is required" },
        { status: 400 },
      );
    }

    console.log(
      "[Charter API] Flights to process:",
      JSON.stringify(flights, null, 2),
    );

    // Find or create client by phone (WhatsApp number is unique identifier)
    // IMPORTANT: First name used with a WhatsApp number persists forever
    let client = await prisma.client.findUnique({
      where: { phone: contactInfo.phone },
    });

    if (!client) {
      // New client - save their name and email
      client = await prisma.client.create({
        data: {
          phone: contactInfo.phone,
          email: contactInfo.email,
          fullName: `${contactInfo.firstName} ${contactInfo.lastName}`,
        },
      });
    } else {
      // Existing client - only update email if provided, NEVER update name
      if (contactInfo.email && contactInfo.email !== client.email) {
        await prisma.client.update({
          where: { id: client.id },
          data: { email: contactInfo.email },
        });
      }
    }

    // Parse flights and find airport IDs
    const flightLegs = [];
    for (let i = 0; i < flights.length; i++) {
      const flight = flights[i];

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
        // Store InstaCharter selected categories as JSON
        selectedCategories:
          selectedCategories && selectedCategories.length > 0
            ? selectedCategories.map((cat: any) => ({
                categoryId: cat.categoryId,
                category: cat.category,
                price: cat.price,
                priceFormatted: cat.priceFormatted,
                maxPassengers: cat.maxPassengers,
                flightTime: cat.flightTime,
                flightTimeFormatted: cat.flightTimeFormatted,
              }))
            : null,
        legs: {
          create: flightLegs,
        },
        // Add selected aircraft if provided (legacy support)
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

    // Send to InstaCharter API
    try {
      // Build journey array from charter quote legs
      const journey = charterQuote.legs.map((leg: any) => {
        const depAirport = leg.departureAirport;
        const arrAirport = leg.arrivalAirport;

        return {
          depTime: leg.departureDateTime.toISOString(),
          pax: charterQuote.passengerCount,
          from: {
            lat: depAirport.latitude,
            long: depAirport.longitude,
            name: formatAirportName(depAirport),
            timeZone: getTimezoneFromRegion(
              depAirport.regionCode,
              depAirport.countryCode,
            ),
          },
          to: {
            lat: arrAirport.latitude,
            long: arrAirport.longitude,
            name: formatAirportName(arrAirport),
            timeZone: getTimezoneFromRegion(
              arrAirport.regionCode,
              arrAirport.countryCode,
            ),
          },
        };
      });

      // Build choices array from selected categories (InstaCharter format) or legacy selectedAircraft
      let choices: Array<{ price: string; category: string; tailId: number }> =
        [];

      if (selectedCategories && selectedCategories.length > 0) {
        // New InstaCharter format - use the price with 5% markup already applied
        choices = selectedCategories.map((category: any) => ({
          price: category.price?.toString() || "0",
          category: category.category || category.originalCategory || "Unknown",
          tailId: category.jets?.[0]?.id || 0, // Use first jet's ID if available
        }));
      } else if (selectedAircraft && selectedAircraft.length > 0) {
        // Legacy format
        choices = selectedAircraft.map((aircraft: any) => ({
          price: aircraft.hourlyRateUsd?.toString() || "0",
          category: aircraft.type || aircraft.category || "Unknown",
          tailId: 0,
        }));
      }

      // Build customer object
      const customer = {
        name: `${contactInfo.firstName} ${contactInfo.lastName}`,
        email: contactInfo.email,
        phone: contactInfo.phone,
        message: buildCustomerMessage(
          contactInfo,
          charterQuote,
          selectedCategories,
        ),
      };

      // Send to InstaCharter
      const instaCharterPayload = {
        choices,
        journey,
        customer,
      };

      console.log(
        "[InstaCharter] Sending payload:",
        JSON.stringify(instaCharterPayload, null, 2),
      );

      const instaResult = await sendToInstaCharter(instaCharterPayload);

      if (instaResult.success) {
        console.log("[InstaCharter] ✓ Lead created successfully");
      } else {
        console.log(
          "[InstaCharter] ✗ Failed to create lead:",
          instaResult.error,
        );
      }
    } catch (instaCharterError: any) {
      console.error("[InstaCharter] Error:", instaCharterError.message);
      // Don't fail the request if InstaCharter fails
    }

    // Send WhatsApp notification to all admins
    try {
      const admins = await prisma.admin.findMany({
        select: { phone: true, fullName: true },
      });

      console.log(`[WhatsApp] Found ${admins.length} admins to notify`);

      // Build itinerary details for each leg
      const formatDateTime = (date: Date) => {
        return date.toLocaleString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      };

      let itineraryText = "";
      for (let i = 0; i < charterQuote.legs.length; i++) {
        const leg = charterQuote.legs[i];
        const depAirport = leg.departureAirport;
        const arrAirport = leg.arrivalAirport;
        const depCode = depAirport?.icaoCode || depAirport?.iataCode || "N/A";
        const arrCode = arrAirport?.icaoCode || arrAirport?.iataCode || "N/A";
        const depCity = depAirport?.municipality || depAirport?.name || depCode;
        const arrCity = arrAirport?.municipality || arrAirport?.name || arrCode;

        itineraryText += `\n*Trip ${i + 1}:* ${depCity} → ${arrCity}`;
        itineraryText += `\n   ${depCode} → ${arrCode}`;
        itineraryText += `\n   ${formatDateTime(leg.departureDateTime)} (LT)`;
      }

      // Build selected categories text
      let categoriesText = "";
      if (selectedCategories && selectedCategories.length > 0) {
        categoriesText = "\n\n*Selected Aircraft:*";
        selectedCategories.forEach((cat: any) => {
          categoriesText += `\n• ${cat.category}: ${cat.priceFormatted || `$${cat.price?.toLocaleString()}`}`;
          if (cat.flightTimeFormatted || cat.flightTime) {
            categoriesText += ` (${cat.flightTimeFormatted || cat.flightTime})`;
          }
        });
      }

      const message =
        `🛩️ *New Charter Quote Request*\n\n` +
        `*Reference:* ${charterQuote.referenceNumber}\n` +
        `*Client:* ${charterQuote.clientName}\n` +
        `*Phone:* ${charterQuote.clientPhone}\n` +
        `*Email:* ${charterQuote.clientEmail}\n` +
        `*Type:* ${charterQuote.flightType.replace("_", " ")}\n` +
        `*Passengers:* ${charterQuote.passengerCount}\n\n` +
        `*Flight Itinerary:*${itineraryText}` +
        `${categoriesText}\n\n` +
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

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pexjet/database";

// Generate reference number
function generateReferenceNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `PEX-EL-${year}-${random}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { emptyLegId, seatsRequested, contactInfo } = body;

    // Validate required fields
    if (!emptyLegId) {
      return NextResponse.json(
        { error: "Empty leg ID is required" },
        { status: 400 },
      );
    }

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

    if (!seatsRequested || seatsRequested < 1) {
      return NextResponse.json(
        { error: "At least 1 seat must be requested" },
        { status: 400 },
      );
    }

    // Get the empty leg with owner info and source
    const emptyLeg = await prisma.emptyLeg.findUnique({
      where: { id: emptyLegId },
      include: {
        departureAirport: {
          select: {
            iataCode: true,
            icaoCode: true,
            municipality: true,
            latitude: true,
            longitude: true,
          },
        },
        arrivalAirport: {
          select: {
            iataCode: true,
            icaoCode: true,
            municipality: true,
            latitude: true,
            longitude: true,
          },
        },
        aircraft: {
          select: { name: true },
        },
        createdByAdmin: {
          select: { id: true, fullName: true, phone: true },
        },
        createdByOperator: {
          select: { id: true, fullName: true, phone: true },
        },
      },
    });

    if (!emptyLeg) {
      return NextResponse.json(
        { error: "Empty leg deal not found" },
        { status: 404 },
      );
    }

    // Check availability
    if (emptyLeg.status !== "PUBLISHED") {
      return NextResponse.json(
        { error: "This deal is no longer available" },
        { status: 400 },
      );
    }

    if (emptyLeg.availableSeats < seatsRequested) {
      return NextResponse.json(
        { error: `Only ${emptyLeg.availableSeats} seats available` },
        { status: 400 },
      );
    }

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

    // Calculate total price (USD) - for empty legs, price is for entire flight regardless of seats
    let totalPriceUsd = 0;

    if (emptyLeg.priceType === "FIXED" && emptyLeg.priceUsd) {
      totalPriceUsd = emptyLeg.priceUsd; // Don't multiply by seats for empty leg deals
    } else {
      // For CONTACT type or null price, set to 0 and handle in notification
      totalPriceUsd = 0;
    }

    // Create the booking/quote
    const booking = await prisma.emptyLegBooking.create({
      data: {
        referenceNumber: generateReferenceNumber(),
        emptyLegId: emptyLeg.id,
        clientId: client.id,
        clientName: `${contactInfo.firstName} ${contactInfo.lastName}`,
        clientEmail: contactInfo.email,
        clientPhone: contactInfo.phone,
        seatsRequested,
        totalPriceUsd,
        status: "PENDING",
        source: emptyLeg.source, // Set source based on empty leg
      },
      include: {
        emptyLeg: {
          include: {
            departureAirport: true,
            arrivalAirport: true,
          },
        },
      },
    });

    // Handle InstaCharter deals - forward to their API
    let externalRequestId = null;
    if (emptyLeg.source === "INSTACHARTER") {
      try {
        // Prepare data for InstaCharter API
        const instacharterPayload = {
          owner: {
            id: process.env.INSTACHARTER_CLIENT_ID || "",
          },
          choices: [
            {
              price: emptyLeg.priceUsd
                ? emptyLeg.priceUsd.toString()
                : "CONTACT",
              category: emptyLeg.aircraftCategory || "UNKNOWN",
              tailId: parseInt(emptyLeg.externalId || "0") || 0,
            },
          ],
          haves: [emptyLeg.id],
          journey: [
            {
              depTime: emptyLeg.departureDateTime.toISOString(),
              pax: seatsRequested,
              from: {
                lat: emptyLeg.departureAirport?.latitude || 0,
                long: emptyLeg.departureAirport?.longitude || 0,
                name: `${emptyLeg.departureCity || emptyLeg.departureAirport?.municipality || ""} (${emptyLeg.departureIcao || emptyLeg.departureAirport?.icaoCode || ""})`,
                timeZone: "UTC", // Default timezone, could be enhanced
              },
              to: {
                lat: emptyLeg.arrivalAirport?.latitude || 0,
                long: emptyLeg.arrivalAirport?.longitude || 0,
                name: `${emptyLeg.arrivalCity || emptyLeg.arrivalAirport?.municipality || ""} (${emptyLeg.arrivalIcao || emptyLeg.arrivalAirport?.icaoCode || ""})`,
                timeZone: "UTC", // Default timezone, could be enhanced
              },
            },
          ],
          customer: {
            name: `${contactInfo.firstName} ${contactInfo.lastName}`,
            email: contactInfo.email,
            phone: contactInfo.phone,
            message: `Quote request for empty leg ${booking.referenceNumber}`,
          },
        };

        // Send to InstaCharter API
        const instacharterResponse = await fetch(
          "https://server.instacharter.app/api/Markets/Sendrequest",
          {
            method: "POST",
            headers: {
              accept: "*/*",
              "X-Api-Key": process.env.INSTACHARTER_API_KEY || "",
              "Content-Type": "application/json",
            },
            body: JSON.stringify(instacharterPayload),
          },
        );

        if (instacharterResponse.ok) {
          const instacharterData = await instacharterResponse.json();
          console.log("InstaCharter API response:", instacharterData);
          externalRequestId = instacharterData.data?.requestId || null;

          // Update booking with external request info
          await prisma.emptyLegBooking.update({
            where: { id: booking.id },
            data: {
              externalRequestId,
              forwardedToExternal: true,
              forwardedAt: new Date(),
            },
          });

          // Log forwarding activity
          await prisma.activityLog.create({
            data: {
              action: "EMPTY_LEG_QUOTE_FORWARDED",
              targetType: "EmptyLegBooking",
              targetId: booking.id,
              clientPhone: contactInfo.phone,
              description: `Empty leg quote ${booking.referenceNumber} forwarded to InstaCharter`,
              metadata: {
                externalRequestId,
                instacharterPayload,
              },
            },
          });
        } else {
          console.error(
            "InstaCharter API error:",
            instacharterResponse.status,
            instacharterResponse.statusText,
          );
          // Still continue with booking creation but log the error
        }
      } catch (instacharterError) {
        console.error("InstaCharter forwarding error:", instacharterError);
        // Still continue with booking creation but log the error
      }
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "EMPTY_LEG_QUOTE_CREATE",
        targetType: "EmptyLegBooking",
        targetId: booking.id,
        clientPhone: contactInfo.phone,
        description: `New empty leg quote request ${booking.referenceNumber} from ${contactInfo.firstName} ${contactInfo.lastName}`,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        metadata: {
          emptyLegId: emptyLeg.id,
          seatsRequested,
          totalPriceUsd,
        },
      },
    });

    // Determine who to notify (admin or operator)
    const isOperatorDeal = !!emptyLeg.createdByOperatorId;

    // Get airport codes - handle both admin and InstaCharter deals
    const departureCode = emptyLeg.departureAirport
      ? emptyLeg.departureAirport.iataCode ||
        emptyLeg.departureAirport.icaoCode ||
        "N/A"
      : emptyLeg.departureIcao || "N/A";

    const arrivalCode = emptyLeg.arrivalAirport
      ? emptyLeg.arrivalAirport.iataCode ||
        emptyLeg.arrivalAirport.icaoCode ||
        "N/A"
      : emptyLeg.arrivalIcao || "N/A";

    // Send WhatsApp notification
    try {
      const priceText =
        emptyLeg.priceType === "CONTACT"
          ? "Contact for price"
          : `$${totalPriceUsd.toLocaleString()}`;

      const sourceText =
        emptyLeg.source === "INSTACHARTER" ? " (InstaCharter)" : "";

      const message =
        `🛩️ *New Empty Leg Quote Request*\n\n` +
        `Reference: ${booking.referenceNumber}\n` +
        `Source: ${emptyLeg.source}${sourceText}\n` +
        `Client: ${booking.clientName}\n` +
        `Phone: ${booking.clientPhone}\n` +
        `Email: ${booking.clientEmail}\n` +
        `Route: ${departureCode} → ${arrivalCode}\n` +
        `Aircraft: ${emptyLeg.aircraft?.name || emptyLeg.aircraftName || "N/A"}\n` +
        `Seats: ${seatsRequested}\n` +
        `Price: ${priceText}\n` +
        (externalRequestId ? `External ID: ${externalRequestId}\n` : "") +
        `\nPlease review in the dashboard.`;

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

        // Helper function to format phone number
        const formatPhone = (phone: string) => {
          let formatted = phone.replace(/[^\d+]/g, "");
          if (!formatted.startsWith("+")) {
            if (formatted.startsWith("0")) {
              formatted = "+234" + formatted.slice(1);
            } else {
              formatted = "+" + formatted;
            }
          }
          return formatted;
        };

        // For InstaCharter deals, always notify all admins
        // For operator deals, notify the specific operator
        // For admin deals, notify all admins
        if (emptyLeg.source === "INSTACHARTER" || !isOperatorDeal) {
          // Notify all admins
          const admins = await prisma.admin.findMany({
            select: { phone: true, fullName: true },
          });

          console.log(`[WhatsApp] Found ${admins.length} admins to notify`);

          for (const admin of admins) {
            const formattedPhone = formatPhone(admin.phone);
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
        } else if (isOperatorDeal && emptyLeg.createdByOperator) {
          // Notify the specific operator
          const formattedPhone = formatPhone(emptyLeg.createdByOperator.phone);
          console.log(
            `[WhatsApp] Sending to operator ${emptyLeg.createdByOperator.fullName} at ${formattedPhone}`,
          );

          try {
            const result = await twilio.messages.create({
              body: message,
              from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
              to: `whatsapp:${formattedPhone}`,
            });
            console.log(
              `[WhatsApp] ✓ Sent to operator ${emptyLeg.createdByOperator.fullName}, SID: ${result.sid}`,
            );
          } catch (twilioError: any) {
            console.error(
              `[WhatsApp] ✗ Failed to send to operator:`,
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
    }

    return NextResponse.json({
      success: true,
      referenceNumber: booking.referenceNumber,
      message:
        emptyLeg.source === "INSTACHARTER"
          ? "Empty leg quote request submitted and forwarded to InstaCharter"
          : "Empty leg quote request submitted successfully",
      source: emptyLeg.source,
      forwardedToExternal: emptyLeg.source === "INSTACHARTER" ? true : false,
      externalRequestId,
    });
  } catch (error: any) {
    console.error("Empty leg quote submission error:", error);
    const msg = error?.message || "";

    // Detect common Postgres 'column does not exist' error caused by schema drift
    if (/column .* does not exist/i.test(msg) || /does not exist/i.test(msg)) {
      return NextResponse.json(
        {
          error:
            "Database schema mismatch: a required column is missing. Please apply the DB migrations (see packages/database/migrations/add_template_fields.sql).",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { error: msg || "Failed to submit quote request" },
      { status: 500 },
    );
  }
}

// GET endpoint for admin to fetch empty leg quotes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const skip = (page - 1) * limit;

    const where: any = {};

    if (status && status !== "all") {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { referenceNumber: { contains: search, mode: "insensitive" } },
        { clientName: { contains: search, mode: "insensitive" } },
        { clientEmail: { contains: search, mode: "insensitive" } },
      ];
    }

    const [quotes, total] = await Promise.all([
      prisma.emptyLegBooking.findMany({
        where,
        include: {
          emptyLeg: {
            include: {
              departureAirport: {
                select: { name: true, icaoCode: true, iataCode: true },
              },
              arrivalAirport: {
                select: { name: true, icaoCode: true, iataCode: true },
              },
              aircraft: {
                select: { name: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.emptyLegBooking.count({ where }),
    ]);

    return NextResponse.json({
      quotes,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error("Empty leg quotes fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch quotes" },
      { status: 500 },
    );
  }
}

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

    // Get the empty leg with owner info
    const emptyLeg = await prisma.emptyLeg.findUnique({
      where: { id: emptyLegId },
      include: {
        departureAirport: {
          select: { iataCode: true, icaoCode: true, municipality: true },
        },
        arrivalAirport: {
          select: { iataCode: true, icaoCode: true, municipality: true },
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

    // Calculate total price (USD)
    const totalPriceUsd = emptyLeg.discountPriceUsd * seatsRequested;

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
    const departureCode =
      emptyLeg.departureAirport.iataCode ||
      emptyLeg.departureAirport.icaoCode ||
      "N/A";
    const arrivalCode =
      emptyLeg.arrivalAirport.iataCode ||
      emptyLeg.arrivalAirport.icaoCode ||
      "N/A";

    // Send WhatsApp notification
    try {
      const message =
        `🛩️ *New Empty Leg Quote Request*\n\n` +
        `Reference: ${booking.referenceNumber}\n` +
        `Client: ${booking.clientName}\n` +
        `Phone: ${booking.clientPhone}\n` +
        `Route: ${departureCode} → ${arrivalCode}\n` +
        `Aircraft: ${emptyLeg.aircraft.name}\n` +
        `Seats: ${seatsRequested}\n` +
        `Total: $${totalPriceUsd.toLocaleString()}\n\n` +
        `Please review in the dashboard.`;

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

        if (isOperatorDeal && emptyLeg.createdByOperator) {
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
        } else {
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
      message: "Empty leg quote request submitted successfully",
    });
  } catch (error: any) {
    console.error("Empty leg quote submission error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit quote request" },
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

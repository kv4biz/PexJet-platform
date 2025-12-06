import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pexjet/database";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      fullName,
      email,
      phone,
      flightType,
      departureCity,
      arrivalCity,
      departureDate,
      returnDate,
      passengers,
      additionalInfo,
    } = body;

    // Validate required fields
    if (!fullName || !email || !phone || !departureCity || !arrivalCity || !departureDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Find or create client by phone
    let client = await prisma.client.findUnique({
      where: { phone },
    });

    if (!client) {
      client = await prisma.client.create({
        data: {
          fullName,
          email,
          phone,
        },
      });
    } else {
      // Update client info if they exist
      client = await prisma.client.update({
        where: { phone },
        data: {
          fullName,
          email,
        },
      });
    }

    // Generate reference number
    const year = new Date().getFullYear();
    const count = await prisma.charterQuote.count();
    const referenceNumber = `PEX-QT-${year}-${String(count + 1).padStart(4, "0")}`;

    // Parse passengers
    let passengerCount = 1;
    if (passengers) {
      const match = passengers.match(/(\d+)/);
      if (match) {
        passengerCount = parseInt(match[1]);
      }
    }

    // Create charter quote with first leg
    const quote = await prisma.charterQuote.create({
      data: {
        referenceNumber,
        clientId: client.id,
        clientName: fullName,
        clientEmail: email,
        clientPhone: phone,
        flightType: flightType || "ONE_WAY",
        passengerCount,
        specialRequests: additionalInfo,
        status: "PENDING",
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "CHARTER_QUOTE_CREATE",
        targetType: "CharterQuote",
        targetId: quote.id,
        description: `New quote request from ${fullName} - ${departureCity} to ${arrivalCity}`,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      },
    });

    return NextResponse.json({
      success: true,
      referenceNumber: quote.referenceNumber,
    });
  } catch (error: any) {
    console.error("Quote submission error:", error);
    return NextResponse.json(
      { error: "Failed to submit quote request" },
      { status: 500 }
    );
  }
}

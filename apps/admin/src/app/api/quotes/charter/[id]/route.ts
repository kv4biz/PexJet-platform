import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pexjet/database";
import { verifyAccessToken, extractTokenFromHeader } from "@pexjet/lib";

// GET individual charter quote
export async function GET(
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

    const quote = await prisma.charterQuote.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
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
                countryCode: true,
                latitude: true,
                longitude: true,
              },
            },
            arrivalAirport: {
              select: {
                id: true,
                name: true,
                municipality: true,
                iataCode: true,
                icaoCode: true,
                countryCode: true,
                latitude: true,
                longitude: true,
              },
            },
            aircraft: {
              select: {
                id: true,
                name: true,
                model: true,
                manufacturer: true,
                category: true,
                passengerCapacityMax: true,
                cruiseSpeedKnots: true,
                hourlyRateUsd: true,
                thumbnailImage: true,
              },
            },
          },
          orderBy: { legNumber: "asc" },
        },
        selectedAircraft: {
          include: {
            aircraft: {
              select: {
                id: true,
                name: true,
                model: true,
                manufacturer: true,
                category: true,
                passengerCapacityMax: true,
                cruiseSpeedKnots: true,
                hourlyRateUsd: true,
                thumbnailImage: true,
              },
            },
          },
        },
        approvedBy: {
          select: { id: true, fullName: true, email: true },
        },
        paymentConfirmedBy: {
          select: { id: true, fullName: true, email: true },
        },
        payment: true,
      },
    });

    if (!quote) {
      return NextResponse.json(
        { error: "Charter quote not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(quote);
  } catch (error: any) {
    console.error("Failed to fetch charter quote:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch charter quote" },
      { status: 500 },
    );
  }
}

// PUT - Update charter quote (admin can edit details)
export async function PUT(
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

    // Find existing quote
    const existingQuote = await prisma.charterQuote.findUnique({
      where: { id },
      include: { legs: true },
    });

    if (!existingQuote) {
      return NextResponse.json(
        { error: "Charter quote not found" },
        { status: 404 },
      );
    }

    // Only allow editing if status is PENDING or APPROVED (before payment)
    if (!["PENDING", "APPROVED"].includes(existingQuote.status)) {
      return NextResponse.json(
        { error: "Cannot edit quote in current status" },
        { status: 400 },
      );
    }

    const {
      passengerCount,
      specialRequests,
      totalPriceUsd,
      legs, // Array of leg updates
    } = body;

    // Start transaction to update quote and legs
    const updatedQuote = await prisma.$transaction(async (tx) => {
      // Update main quote fields
      const quoteUpdate: any = {};
      if (passengerCount !== undefined)
        quoteUpdate.passengerCount = passengerCount;
      if (specialRequests !== undefined)
        quoteUpdate.specialRequests = specialRequests;
      if (totalPriceUsd !== undefined)
        quoteUpdate.totalPriceUsd = parseFloat(totalPriceUsd);

      // Update quote
      await tx.charterQuote.update({
        where: { id },
        data: quoteUpdate,
      });

      // Update legs if provided
      if (legs && Array.isArray(legs)) {
        for (const leg of legs) {
          if (!leg.id) continue;

          const legUpdate: any = {};
          if (leg.departureAirportId)
            legUpdate.departureAirportId = leg.departureAirportId;
          if (leg.arrivalAirportId)
            legUpdate.arrivalAirportId = leg.arrivalAirportId;
          if (leg.departureDateTime)
            legUpdate.departureDateTime = new Date(leg.departureDateTime);
          if (leg.aircraftId !== undefined)
            legUpdate.aircraftId = leg.aircraftId || null;
          if (leg.priceUsd !== undefined)
            legUpdate.priceUsd = leg.priceUsd ? parseFloat(leg.priceUsd) : null;

          await tx.charterLeg.update({
            where: { id: leg.id },
            data: legUpdate,
          });
        }
      }

      // Log activity
      await tx.activityLog.create({
        data: {
          action: "CHARTER_QUOTE_UPDATE",
          targetType: "CharterQuote",
          targetId: id,
          adminId: payload.sub,
          description: `Updated charter quote ${existingQuote.referenceNumber}`,
          ipAddress: request.headers.get("x-forwarded-for") || "unknown",
          metadata: body,
        },
      });

      // Return updated quote with all relations
      return tx.charterQuote.findUnique({
        where: { id },
        include: {
          client: {
            select: { id: true, fullName: true, email: true, phone: true },
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
                select: { id: true, name: true, model: true },
              },
            },
            orderBy: { legNumber: "asc" },
          },
          selectedAircraft: {
            include: {
              aircraft: { select: { id: true, name: true, model: true } },
            },
          },
        },
      });
    });

    return NextResponse.json(updatedQuote);
  } catch (error: any) {
    console.error("Failed to update charter quote:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update charter quote" },
      { status: 500 },
    );
  }
}

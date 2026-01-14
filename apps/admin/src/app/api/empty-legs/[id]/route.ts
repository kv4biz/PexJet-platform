import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pexjet/database";
import { verifyAccessToken, extractTokenFromHeader } from "@pexjet/lib";

/**
 * Parse a datetime string and return a Date object that preserves the local time.
 * Treats the input as local time and stores as UTC to prevent timezone conversion.
 */
function parseLocalTimeAsUTC(dateString: string): Date {
  const match = dateString.match(
    /(\d{4})-(\d{2})-(\d{2})T?(\d{2})?:?(\d{2})?:?(\d{2})?/,
  );
  if (!match) {
    return new Date();
  }
  const [, year, month, day, hours = "00", minutes = "00", seconds = "00"] =
    match;
  return new Date(
    Date.UTC(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hours),
      parseInt(minutes),
      parseInt(seconds),
    ),
  );
}

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

    const emptyLeg = await prisma.emptyLeg.findUnique({
      where: { id },
      include: {
        aircraft: {
          select: {
            id: true,
            name: true,
            manufacturer: true,
            category: true,
            maxPax: true,
            rangeNm: true,
            cruiseSpeedKnots: true,
            image: true,
          },
        },
        departureAirport: {
          select: {
            id: true,
            name: true,
            municipality: true,
            iataCode: true,
            icaoCode: true,
            localCode: true,
            gpsCode: true,
            countryCode: true,
            latitude: true,
            longitude: true,
            region: { select: { name: true } },
          },
        },
        arrivalAirport: {
          select: {
            id: true,
            name: true,
            municipality: true,
            iataCode: true,
            icaoCode: true,
            localCode: true,
            gpsCode: true,
            countryCode: true,
            latitude: true,
            longitude: true,
            region: { select: { name: true } },
          },
        },
        createdByAdmin: {
          select: { id: true, fullName: true, email: true },
        },
        createdByOperator: {
          select: { id: true, fullName: true, email: true },
        },
        bookings: {
          include: {
            client: {
              select: { id: true, fullName: true, phone: true, email: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!emptyLeg) {
      return NextResponse.json(
        { error: "Empty leg not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(emptyLeg);
  } catch (error: any) {
    console.error("Empty leg fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch empty leg" },
      { status: 500 },
    );
  }
}

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

    const {
      aircraftId,
      departureDateTime,
      totalSeats,
      priceType,
      priceUsd,
      status,
    } = body;

    // Check if empty leg exists
    const existingEmptyLeg = await prisma.emptyLeg.findUnique({
      where: { id },
    });

    if (!existingEmptyLeg) {
      return NextResponse.json(
        { error: "Empty leg not found" },
        { status: 404 },
      );
    }

    // Build update data
    const updateData: any = {};

    if (aircraftId) updateData.aircraftId = aircraftId;
    if (departureDateTime)
      updateData.departureDateTime = parseLocalTimeAsUTC(departureDateTime);
    if (totalSeats !== undefined) {
      updateData.totalSeats = parseInt(totalSeats);
      // Update availableSeats to match new total if it was equal to old total
      if (existingEmptyLeg.availableSeats === existingEmptyLeg.totalSeats) {
        updateData.availableSeats = parseInt(totalSeats);
      }
    }
    if (priceType) updateData.priceType = priceType;
    if (priceUsd !== undefined) {
      updateData.priceUsd = priceType === "FIXED" ? parseFloat(priceUsd) : null;
    }
    if (status) updateData.status = status;

    const emptyLeg = await prisma.emptyLeg.update({
      where: { id },
      data: updateData,
      include: {
        aircraft: {
          select: {
            name: true,
            manufacturer: true,
            category: true,
            maxPax: true,
            image: true,
          },
        },
        departureAirport: {
          select: { name: true, municipality: true, iataCode: true },
        },
        arrivalAirport: {
          select: { name: true, municipality: true, iataCode: true },
        },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "EMPTY_LEG_UPDATE",
        targetType: "EmptyLeg",
        targetId: emptyLeg.id,
        adminId: payload.sub,
        description: `Updated empty leg: ${emptyLeg.departureAirport?.municipality || emptyLeg.departureAirport?.name || "Unknown"} → ${emptyLeg.arrivalAirport?.municipality || emptyLeg.arrivalAirport?.name || "Unknown"}`,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        metadata: updateData,
      },
    });

    return NextResponse.json(emptyLeg);
  } catch (error: any) {
    console.error("Empty leg update error:", error);
    return NextResponse.json(
      { error: "Failed to update empty leg" },
      { status: 500 },
    );
  }
}

export async function DELETE(
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

    // Check if empty leg exists
    const emptyLeg = await prisma.emptyLeg.findUnique({
      where: { id },
      include: {
        departureAirport: { select: { name: true, municipality: true } },
        arrivalAirport: { select: { name: true, municipality: true } },
      },
    });

    if (!emptyLeg) {
      return NextResponse.json(
        { error: "Empty leg not found" },
        { status: 404 },
      );
    }

    await prisma.emptyLeg.delete({ where: { id } });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "EMPTY_LEG_CLOSE",
        targetType: "EmptyLeg",
        targetId: id,
        adminId: payload.sub,
        description: `Deleted empty leg: ${emptyLeg.departureAirport.municipality || emptyLeg.departureAirport.name} → ${emptyLeg.arrivalAirport.municipality || emptyLeg.arrivalAirport.name}`,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Empty leg delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete empty leg" },
      { status: 500 },
    );
  }
}

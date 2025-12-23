import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pexjet/database";
import { verifyAccessToken, extractTokenFromHeader } from "@pexjet/lib";

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
            model: true,
            manufacturer: true,
            category: true,
            passengerCapacityMax: true,
            passengerCapacityMin: true,
            rangeNm: true,
            cruiseSpeedKnots: true,
            thumbnailImage: true,
            exteriorImages: true,
            interiorImages: true,
          },
        },
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
      departureAirportId,
      arrivalAirportId,
      departureDateTime,
      totalSeats,
      availableSeats,
      originalPrice,
      discountPrice,
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
    if (departureAirportId) updateData.departureAirportId = departureAirportId;
    if (arrivalAirportId) updateData.arrivalAirportId = arrivalAirportId;
    if (departureDateTime)
      updateData.departureDateTime = new Date(departureDateTime);
    if (totalSeats !== undefined) updateData.totalSeats = parseInt(totalSeats);
    if (availableSeats !== undefined)
      updateData.availableSeats = parseInt(availableSeats);
    if (originalPrice !== undefined)
      updateData.originalPrice = parseFloat(originalPrice);
    if (discountPrice !== undefined)
      updateData.discountPrice = parseFloat(discountPrice);
    if (status) updateData.status = status;

    const emptyLeg = await prisma.emptyLeg.update({
      where: { id },
      data: updateData,
      include: {
        aircraft: { select: { name: true, model: true } },
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
        description: `Updated empty leg: ${emptyLeg.departureAirport.municipality || emptyLeg.departureAirport.name} → ${emptyLeg.arrivalAirport.municipality || emptyLeg.arrivalAirport.name}`,
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

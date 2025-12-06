import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pexjet/database";
import { verifyAccessToken, extractTokenFromHeader, notifyAircraftUpdate, notifyAircraftDelete } from "@pexjet/lib";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const token = extractTokenFromHeader(request.headers.get("authorization"));
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyAccessToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const aircraft = await prisma.aircraft.findUnique({
      where: { id: params.id },
    });

    if (!aircraft) {
      return NextResponse.json({ error: "Aircraft not found" }, { status: 404 });
    }

    return NextResponse.json(aircraft);
  } catch (error: any) {
    console.error("Aircraft fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch aircraft" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const body = await request.json();
    const {
      name,
      model,
      manufacturer,
      category,
      availability,
      passengerCapacityMin,
      passengerCapacityMax,
      rangeNm,
      cruiseSpeedKnots,
      baggageCapacityCuFt,
      cabinLengthFt,
      cabinWidthFt,
      cabinHeightFt,
      lengthFt,
      wingspanFt,
      heightFt,
      yearOfManufacture,
      hourlyRateUsd,
      description,
    } = body;

    const existing = await prisma.aircraft.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Aircraft not found" }, { status: 404 });
    }

    const aircraft = await prisma.aircraft.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(model && { model }),
        ...(manufacturer && { manufacturer }),
        ...(category && { category }),
        ...(availability && { availability }),
        ...(passengerCapacityMin !== undefined && { passengerCapacityMin: parseInt(passengerCapacityMin) }),
        ...(passengerCapacityMax !== undefined && { passengerCapacityMax: parseInt(passengerCapacityMax) }),
        ...(rangeNm !== undefined && { rangeNm: parseInt(rangeNm) }),
        ...(cruiseSpeedKnots !== undefined && { cruiseSpeedKnots: parseInt(cruiseSpeedKnots) }),
        ...(baggageCapacityCuFt !== undefined && { baggageCapacityCuFt: baggageCapacityCuFt ? parseFloat(baggageCapacityCuFt) : null }),
        ...(cabinLengthFt !== undefined && { cabinLengthFt: cabinLengthFt ? parseFloat(cabinLengthFt) : null }),
        ...(cabinWidthFt !== undefined && { cabinWidthFt: cabinWidthFt ? parseFloat(cabinWidthFt) : null }),
        ...(cabinHeightFt !== undefined && { cabinHeightFt: cabinHeightFt ? parseFloat(cabinHeightFt) : null }),
        ...(lengthFt !== undefined && { lengthFt: lengthFt ? parseFloat(lengthFt) : null }),
        ...(wingspanFt !== undefined && { wingspanFt: wingspanFt ? parseFloat(wingspanFt) : null }),
        ...(heightFt !== undefined && { heightFt: heightFt ? parseFloat(heightFt) : null }),
        ...(yearOfManufacture !== undefined && { yearOfManufacture: yearOfManufacture ? parseInt(yearOfManufacture) : null }),
        ...(hourlyRateUsd !== undefined && { hourlyRateUsd: hourlyRateUsd ? parseFloat(hourlyRateUsd) : null }),
        ...(description !== undefined && { description: description || null }),
      },
    });

    await prisma.activityLog.create({
      data: {
        action: "AIRCRAFT_UPDATE",
        targetType: "Aircraft",
        targetId: aircraft.id,
        adminId: payload.sub,
        description: `Updated aircraft ${aircraft.name}`,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      },
    });

    // Trigger real-time update
    await notifyAircraftUpdate({
      id: aircraft.id,
      name: aircraft.name,
    });

    return NextResponse.json(aircraft);
  } catch (error: any) {
    console.error("Aircraft update error:", error);
    return NextResponse.json(
      { error: "Failed to update aircraft" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const token = extractTokenFromHeader(request.headers.get("authorization"));
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyAccessToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Check if aircraft exists
    const existing = await prisma.aircraft.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Aircraft not found" }, { status: 404 });
    }

    // Delete aircraft
    await prisma.aircraft.delete({
      where: { id: params.id },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "AIRCRAFT_DELETE",
        targetType: "Aircraft",
        targetId: params.id,
        adminId: payload.sub,
        description: `Deleted aircraft ${existing.name}`,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      },
    });

    // Trigger real-time update
    await notifyAircraftDelete({ id: params.id });

    return NextResponse.json({ message: "Aircraft deleted successfully" });
  } catch (error: any) {
    console.error("Aircraft delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete aircraft" },
      { status: 500 }
    );
  }
}

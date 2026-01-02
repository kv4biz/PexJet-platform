import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pexjet/database";
import { verifyAccessToken, extractTokenFromHeader } from "@pexjet/lib";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
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
      select: {
        id: true,
        name: true,
        manufacturer: true,
        category: true,
        availability: true,
        image: true,
        minPax: true,
        maxPax: true,
        baggageCuFt: true,
        rangeNm: true,
        cruiseSpeedKnots: true,
        fuelCapacityGal: true,
        cabinLengthFt: true,
        cabinWidthFt: true,
        cabinHeightFt: true,
        exteriorLengthFt: true,
        exteriorWingspanFt: true,
        exteriorHeightFt: true,
        basePricePerHour: true as any,
        createdAt: true,
      },
    });

    if (!aircraft) {
      return NextResponse.json(
        { error: "Aircraft not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(aircraft);
  } catch (error: any) {
    console.error("Aircraft fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch aircraft" },
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

    const body = await request.json();
    const {
      name,
      manufacturer,
      category,
      availability,
      image,
      minPax,
      maxPax,
      baggageCuFt,
      rangeNm,
      cruiseSpeedKnots,
      fuelCapacityGal,
      cabinLengthFt,
      cabinWidthFt,
      cabinHeightFt,
      exteriorLengthFt,
      exteriorWingspanFt,
      exteriorHeightFt,
      basePricePerHour,
    } = body;

    const existing = await prisma.aircraft.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Aircraft not found" },
        { status: 404 },
      );
    }

    const aircraft = await prisma.aircraft.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(manufacturer && { manufacturer }),
        ...(category && { category }),
        ...(availability && { availability }),
        ...(image !== undefined && { image: image || null }),
        ...(minPax !== undefined && {
          minPax: minPax ? parseInt(minPax) : null,
        }),
        ...(maxPax !== undefined && {
          maxPax: maxPax ? parseInt(maxPax) : null,
        }),
        ...(baggageCuFt !== undefined && {
          baggageCuFt: baggageCuFt ? parseFloat(baggageCuFt) : null,
        }),
        ...(rangeNm !== undefined && {
          rangeNm: rangeNm ? parseFloat(rangeNm) : null,
        }),
        ...(cruiseSpeedKnots !== undefined && {
          cruiseSpeedKnots: cruiseSpeedKnots
            ? parseFloat(cruiseSpeedKnots)
            : null,
        }),
        ...(fuelCapacityGal !== undefined && {
          fuelCapacityGal: fuelCapacityGal ? parseFloat(fuelCapacityGal) : null,
        }),
        ...(cabinLengthFt !== undefined && {
          cabinLengthFt: cabinLengthFt ? parseFloat(cabinLengthFt) : null,
        }),
        ...(cabinWidthFt !== undefined && {
          cabinWidthFt: cabinWidthFt ? parseFloat(cabinWidthFt) : null,
        }),
        ...(cabinHeightFt !== undefined && {
          cabinHeightFt: cabinHeightFt ? parseFloat(cabinHeightFt) : null,
        }),
        ...(exteriorLengthFt !== undefined && {
          exteriorLengthFt: exteriorLengthFt
            ? parseFloat(exteriorLengthFt)
            : null,
        }),
        ...(exteriorWingspanFt !== undefined && {
          exteriorWingspanFt: exteriorWingspanFt
            ? parseFloat(exteriorWingspanFt)
            : null,
        }),
        ...(exteriorHeightFt !== undefined && {
          exteriorHeightFt: exteriorHeightFt
            ? parseFloat(exteriorHeightFt)
            : null,
        }),
        ...(basePricePerHour !== undefined && {
          basePricePerHour: basePricePerHour
            ? (parseFloat(basePricePerHour) as any)
            : null,
        }),
      },
      select: {
        id: true,
        name: true,
        manufacturer: true,
        category: true,
        availability: true,
        image: true,
        minPax: true,
        maxPax: true,
        baggageCuFt: true,
        rangeNm: true,
        cruiseSpeedKnots: true,
        fuelCapacityGal: true,
        cabinLengthFt: true,
        cabinWidthFt: true,
        cabinHeightFt: true,
        exteriorLengthFt: true,
        exteriorWingspanFt: true,
        exteriorHeightFt: true,
        basePricePerHour: true as any,
        createdAt: true,
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

    return NextResponse.json(aircraft);
  } catch (error: any) {
    console.error("Aircraft update error:", error);
    return NextResponse.json(
      { error: "Failed to update aircraft" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
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
      return NextResponse.json(
        { error: "Aircraft not found" },
        { status: 404 },
      );
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

    return NextResponse.json({ message: "Aircraft deleted successfully" });
  } catch (error: any) {
    console.error("Aircraft delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete aircraft" },
      { status: 500 },
    );
  }
}

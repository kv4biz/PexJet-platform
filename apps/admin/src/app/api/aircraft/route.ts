import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pexjet/database";
import { verifyAccessToken, extractTokenFromHeader } from "@pexjet/lib";

export async function GET(request: NextRequest) {
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";

    const skip = (page - 1) * limit;

    // Build where clause
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { model: { contains: search, mode: "insensitive" as const } },
            {
              manufacturer: { contains: search, mode: "insensitive" as const },
            },
          ],
        }
      : {};

    // Fetch aircraft with pagination
    const [aircraft, total] = await Promise.all([
      prisma.aircraft.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          model: true,
          manufacturer: true,
          category: true,
          availability: true,
          passengerCapacityMin: true,
          passengerCapacityMax: true,
          cruiseSpeedKnots: true,
          rangeNm: true,
          yearOfManufacture: true,
          exteriorImages: true,
          interiorImages: true,
          thumbnailImage: true,
          description: true,
          baggageCapacityCuFt: true,
          fuelCapacityGal: true,
          cabinLengthFt: true,
          cabinWidthFt: true,
          cabinHeightFt: true,
          lengthFt: true,
          wingspanFt: true,
          heightFt: true,
          hourlyRateUsd: true,
        },
      }),
      prisma.aircraft.count({ where }),
    ]);

    return NextResponse.json({
      aircraft,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error("Aircraft fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch aircraft" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
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
      fuelCapacityGal,
      cabinLengthFt,
      cabinWidthFt,
      cabinHeightFt,
      lengthFt,
      wingspanFt,
      heightFt,
      yearOfManufacture,
      hourlyRateUsd,
      description,
      exteriorImages,
      interiorImages,
      thumbnailImage,
    } = body;

    // Validate required fields
    if (
      !name ||
      !model ||
      !manufacturer ||
      !category ||
      !passengerCapacityMin ||
      !passengerCapacityMax ||
      !rangeNm ||
      !cruiseSpeedKnots
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Create aircraft
    const aircraft = await prisma.aircraft.create({
      data: {
        name,
        model,
        manufacturer,
        category,
        availability: availability || "NONE",
        passengerCapacityMin: parseInt(passengerCapacityMin),
        passengerCapacityMax: parseInt(passengerCapacityMax),
        rangeNm: parseInt(rangeNm),
        cruiseSpeedKnots: parseInt(cruiseSpeedKnots),
        baggageCapacityCuFt: baggageCapacityCuFt
          ? parseFloat(baggageCapacityCuFt)
          : null,
        fuelCapacityGal: fuelCapacityGal ? parseFloat(fuelCapacityGal) : null,
        cabinLengthFt: cabinLengthFt ? parseFloat(cabinLengthFt) : null,
        cabinWidthFt: cabinWidthFt ? parseFloat(cabinWidthFt) : null,
        cabinHeightFt: cabinHeightFt ? parseFloat(cabinHeightFt) : null,
        lengthFt: lengthFt ? parseFloat(lengthFt) : null,
        wingspanFt: wingspanFt ? parseFloat(wingspanFt) : null,
        heightFt: heightFt ? parseFloat(heightFt) : null,
        yearOfManufacture: yearOfManufacture
          ? parseInt(yearOfManufacture)
          : null,
        hourlyRateUsd: hourlyRateUsd ? parseFloat(hourlyRateUsd) : null,
        description: description || null,
        exteriorImages: exteriorImages || [],
        interiorImages: interiorImages || [],
        thumbnailImage: thumbnailImage || null,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "AIRCRAFT_CREATE",
        targetType: "Aircraft",
        targetId: aircraft.id,
        adminId: payload.sub,
        description: `Created aircraft ${name}`,
        metadata: { name, model, manufacturer },
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      },
    });

    return NextResponse.json(aircraft, { status: 201 });
  } catch (error: any) {
    console.error("Aircraft create error:", error);
    return NextResponse.json(
      { error: "Failed to create aircraft" },
      { status: 500 },
    );
  }
}

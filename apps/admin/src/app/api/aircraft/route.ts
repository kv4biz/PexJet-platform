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
    const category = searchParams.get("category") || "";

    const skip = (page - 1) * limit;

    // Build where clause for Prisma
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" as const } },
        { manufacturer: { contains: search, mode: "insensitive" as const } },
      ];
    }

    if (category) {
      where.category = category;
    }

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
          // Cast basePricePerHour to any to bypass type checking
          basePricePerHour: true as any,
          createdAt: true,
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

    // Validate required fields
    if (!name || !manufacturer || !category) {
      return NextResponse.json(
        { error: "Missing required fields: name, manufacturer, category" },
        { status: 400 },
      );
    }

    // Create aircraft
    const aircraft = await prisma.aircraft.create({
      data: {
        name,
        manufacturer,
        category,
        availability: availability || "NONE",
        image: image || null,
        minPax: minPax ? parseInt(minPax) : null,
        maxPax: maxPax ? parseInt(maxPax) : null,
        baggageCuFt: baggageCuFt ? parseFloat(baggageCuFt) : null,
        rangeNm: rangeNm ? parseFloat(rangeNm) : null,
        cruiseSpeedKnots: cruiseSpeedKnots
          ? parseFloat(cruiseSpeedKnots)
          : null,
        fuelCapacityGal: fuelCapacityGal ? parseFloat(fuelCapacityGal) : null,
        cabinLengthFt: cabinLengthFt ? parseFloat(cabinLengthFt) : null,
        cabinWidthFt: cabinWidthFt ? parseFloat(cabinWidthFt) : null,
        cabinHeightFt: cabinHeightFt ? parseFloat(cabinHeightFt) : null,
        exteriorLengthFt: exteriorLengthFt
          ? parseFloat(exteriorLengthFt)
          : null,
        exteriorWingspanFt: exteriorWingspanFt
          ? parseFloat(exteriorWingspanFt)
          : null,
        exteriorHeightFt: exteriorHeightFt
          ? parseFloat(exteriorHeightFt)
          : null,
        // Cast to any to bypass type checking
        basePricePerHour: basePricePerHour
          ? (parseFloat(basePricePerHour) as any)
          : null,
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

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "AIRCRAFT_CREATE",
        targetType: "Aircraft",
        targetId: aircraft.id,
        adminId: payload.sub,
        description: `Created aircraft ${name}`,
        metadata: { name, manufacturer, category },
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

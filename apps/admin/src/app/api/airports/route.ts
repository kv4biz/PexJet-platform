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
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const sort = searchParams.get("sort") || "asc";
    const type = searchParams.get("type") || "";

    const skip = (page - 1) * limit;

    // Build where clause
    const whereConditions: any[] = [];

    // Filter for small, medium and large airports (exclude heliports, seaplane bases, etc.)
    whereConditions.push({
      type: { in: ["small_airport", "medium_airport", "large_airport"] },
    });

    // Only show airports with both 3-letter code (IATA or local) AND 4-letter code (ICAO or GPS)
    whereConditions.push({
      OR: [{ iataCode: { not: null } }, { localCode: { not: null } }],
    });
    whereConditions.push({
      OR: [{ icaoCode: { not: null } }, { gpsCode: { not: null } }],
    });

    // Search filter - by ICAO/GPS code (4-letter) or IATA/local code (3-letter)
    if (search) {
      whereConditions.push({
        OR: [
          { icaoCode: { contains: search, mode: "insensitive" as const } },
          { gpsCode: { contains: search, mode: "insensitive" as const } },
          { iataCode: { contains: search, mode: "insensitive" as const } },
          { localCode: { contains: search, mode: "insensitive" as const } },
        ],
      });
    }

    // Type filter (additional filter if specified)
    if (type) {
      whereConditions.push({ type: type as any });
    }

    const where = whereConditions.length > 0 ? { AND: whereConditions } : {};

    // Fetch airports with pagination
    const [airports, total] = await Promise.all([
      prisma.airport.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: sort as "asc" | "desc" },
        select: {
          id: true,
          ident: true,
          icaoCode: true,
          iataCode: true,
          localCode: true,
          gpsCode: true,
          name: true,
          municipality: true,
          countryCode: true,
          regionCode: true,
          continent: true,
          type: true,
          latitude: true,
          longitude: true,
          elevationFt: true,
          scheduledService: true,
          country: {
            select: {
              name: true,
            },
          },
          region: {
            select: {
              name: true,
            },
          },
        },
      }),
      prisma.airport.count({ where }),
    ]);

    return NextResponse.json({
      airports,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error("Airports fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch airports" },
      { status: 500 },
    );
  }
}

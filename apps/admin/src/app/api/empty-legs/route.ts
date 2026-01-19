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

/**
 * Format a Date object as a local time string for slug generation.
 * Uses UTC methods since we store local time as UTC.
 */
function formatDateForSlug(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Helper to generate SEO-friendly slug
function generateSlug(departure: string, arrival: string, date: Date): string {
  const dateStr = formatDateForSlug(date);
  const baseSlug = `${departure}-to-${arrival}-${dateStr}`
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-");
  const uniqueId = Date.now().toString(36);
  return `${baseSlug}-${uniqueId}`;
}

// Helper to calculate estimated arrival and duration using average cruise speed
function calculateFlightDetails(
  departureDateTime: Date,
  distanceNm: number,
  cruiseSpeedKnots: number,
): { estimatedArrival: Date; estimatedDurationMin: number } {
  // Use 90% of cruise speed as average (accounts for climb/descent phases)
  const averageCruiseSpeed = cruiseSpeedKnots * 0.9;

  // Calculate cruise time
  const cruiseTimeHours = distanceNm / averageCruiseSpeed;
  const cruiseTimeMin = cruiseTimeHours * 60;

  // Add fixed overhead for taxi, takeoff, climb, descent, and landing
  // Taxi out: ~10 min, Climb: ~10-15 min, Descent: ~10-15 min, Taxi in: ~5 min
  const taxiAndOverheadMin = 30;

  // For short flights (<300nm), reduce overhead slightly
  // For long flights (>1500nm), add a bit more for cruise altitude changes
  let adjustedOverhead = taxiAndOverheadMin;
  if (distanceNm < 300) {
    adjustedOverhead = 25; // Shorter climb/descent for short hops
  } else if (distanceNm > 1500) {
    adjustedOverhead = 40; // Longer for transcontinental
  }

  const estimatedDurationMin = Math.round(cruiseTimeMin + adjustedOverhead);
  const estimatedArrival = new Date(
    departureDateTime.getTime() + estimatedDurationMin * 60 * 1000,
  );
  return { estimatedArrival, estimatedDurationMin };
}

// Haversine formula to calculate distance between two coordinates
function calculateDistanceNm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 3440.065; // Earth's radius in nautical miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function GET(request: NextRequest) {
  try {
    const token = extractTokenFromHeader(request.headers.get("authorization"));
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyAccessToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const source = searchParams.get("source") || "";

    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (source) {
      where.source = source;
    }

    if (search) {
      where.OR = [
        { slug: { contains: search, mode: "insensitive" } },
        { aircraft: { name: { contains: search, mode: "insensitive" } } },
        {
          aircraft: { manufacturer: { contains: search, mode: "insensitive" } },
        },
        {
          departureAirport: { name: { contains: search, mode: "insensitive" } },
        },
        {
          departureAirport: {
            iataCode: { contains: search, mode: "insensitive" },
          },
        },
        {
          departureAirport: {
            icaoCode: { contains: search, mode: "insensitive" },
          },
        },
        {
          departureAirport: {
            municipality: { contains: search, mode: "insensitive" },
          },
        },
        { arrivalAirport: { name: { contains: search, mode: "insensitive" } } },
        {
          arrivalAirport: {
            iataCode: { contains: search, mode: "insensitive" },
          },
        },
        {
          arrivalAirport: {
            icaoCode: { contains: search, mode: "insensitive" },
          },
        },
        {
          arrivalAirport: {
            municipality: { contains: search, mode: "insensitive" },
          },
        },
        // InstaCharter denormalized fields
        { departureIcao: { contains: search, mode: "insensitive" } },
        { departureCity: { contains: search, mode: "insensitive" } },
        { arrivalIcao: { contains: search, mode: "insensitive" } },
        { arrivalCity: { contains: search, mode: "insensitive" } },
        { aircraftName: { contains: search, mode: "insensitive" } },
        { aircraftType: { contains: search, mode: "insensitive" } },
        { operatorName: { contains: search, mode: "insensitive" } },
      ];
    }

    const [emptyLegs, total] = await Promise.all([
      prisma.emptyLeg.findMany({
        where,
        skip,
        take: limit,
        orderBy: { departureDateTime: "desc" },
        include: {
          aircraft: {
            select: {
              id: true,
              name: true,
              manufacturer: true,
              category: true,
              maxPax: true,
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
              countryCode: true,
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
            },
          },
          createdByAdmin: {
            select: { id: true, fullName: true },
          },
          createdByOperator: {
            select: { id: true, fullName: true },
          },
          _count: {
            select: { bookings: true },
          },
        },
      }),
      prisma.emptyLeg.count({ where }),
    ]);

    return NextResponse.json({
      emptyLegs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error("Empty legs fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch empty legs" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
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
      aircraftId,
      departureAirportId,
      arrivalAirportId,
      departureDateTime,
      totalSeats,
      priceType,
      priceUsd,
    } = body;

    // Validation
    if (
      !aircraftId ||
      !departureAirportId ||
      !arrivalAirportId ||
      !departureDateTime ||
      !totalSeats ||
      !priceType ||
      (priceType === "FIXED" && !priceUsd)
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Get airport and aircraft details for calculations
    const [departureAirport, arrivalAirport, aircraft] = await Promise.all([
      prisma.airport.findUnique({
        where: { id: departureAirportId },
        select: {
          name: true,
          municipality: true,
          latitude: true,
          longitude: true,
        },
      }),
      prisma.airport.findUnique({
        where: { id: arrivalAirportId },
        select: {
          name: true,
          municipality: true,
          latitude: true,
          longitude: true,
        },
      }),
      prisma.aircraft.findUnique({
        where: { id: aircraftId },
        select: { cruiseSpeedKnots: true },
      }),
    ]);

    if (!departureAirport || !arrivalAirport || !aircraft) {
      console.error("Missing data:", {
        departureAirport,
        arrivalAirport,
        aircraft,
      });
      return NextResponse.json(
        { error: "Invalid airport or aircraft ID" },
        { status: 400 },
      );
    }

    // Validate coordinates exist
    if (
      departureAirport.latitude === null ||
      departureAirport.longitude === null ||
      arrivalAirport.latitude === null ||
      arrivalAirport.longitude === null
    ) {
      console.error("Missing coordinates:", {
        depLat: departureAirport.latitude,
        depLon: departureAirport.longitude,
        arrLat: arrivalAirport.latitude,
        arrLon: arrivalAirport.longitude,
      });
      return NextResponse.json(
        { error: "Airport coordinates are missing" },
        { status: 400 },
      );
    }

    // Validate aircraft speed
    if (!aircraft.cruiseSpeedKnots || aircraft.cruiseSpeedKnots <= 0) {
      return NextResponse.json(
        { error: "Aircraft cruise speed is not set" },
        { status: 400 },
      );
    }

    // Calculate distance and flight time
    const distanceNm = calculateDistanceNm(
      departureAirport.latitude!,
      departureAirport.longitude!,
      arrivalAirport.latitude!,
      arrivalAirport.longitude!,
    );

    // Parse datetime as local time (stored as UTC to preserve the exact time)
    const departureDT = parseLocalTimeAsUTC(departureDateTime);

    const { estimatedArrival, estimatedDurationMin } = calculateFlightDetails(
      departureDT,
      distanceNm,
      aircraft.cruiseSpeedKnots,
    );

    // Generate SEO-friendly slug
    const slug = generateSlug(
      departureAirport.municipality || departureAirport.name,
      arrivalAirport.municipality || arrivalAirport.name,
      departureDT,
    );

    const emptyLeg = await prisma.emptyLeg.create({
      data: {
        slug,
        source: "ADMIN",
        aircraftId,
        departureAirportId,
        arrivalAirportId,
        departureDateTime: departureDT,
        totalSeats: parseInt(totalSeats),
        availableSeats: parseInt(totalSeats),
        priceType: priceType,
        priceUsd: priceType === "FIXED" ? parseFloat(priceUsd) : null,
        status: "PUBLISHED",
        createdByAdminId: payload.sub,
      },
      include: {
        aircraft: {
          select: { name: true, manufacturer: true },
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
        action: "EMPTY_LEG_CREATE",
        targetType: "EmptyLeg",
        targetId: emptyLeg.id,
        adminId: payload.sub,
        description: `Created empty leg: ${departureAirport.municipality || departureAirport.name} → ${arrivalAirport.municipality || arrivalAirport.name}`,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        metadata: {
          slug,
          departureDateTime: departureDT.toISOString(),
          totalSeats,
          priceUsd,
        },
      },
    });

    return NextResponse.json(emptyLeg, { status: 201 });
  } catch (error: any) {
    console.error("Empty leg create error:", error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);

    // Handle unique constraint violation for slug
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "A similar empty leg already exists" },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to create empty leg" },
      { status: 500 },
    );
  }
}

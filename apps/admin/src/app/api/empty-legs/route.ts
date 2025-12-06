import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pexjet/database";
import { verifyAccessToken, extractTokenFromHeader } from "@pexjet/lib";

// Helper to generate SEO-friendly slug
function generateSlug(departure: string, arrival: string, date: Date): string {
  const dateStr = date.toISOString().split("T")[0];
  const baseSlug = `${departure}-to-${arrival}-${dateStr}`
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-");
  const uniqueId = Date.now().toString(36);
  return `${baseSlug}-${uniqueId}`;
}

// Helper to calculate estimated arrival and duration
function calculateFlightDetails(
  departureDateTime: Date,
  distanceNm: number,
  cruiseSpeedKnots: number,
): { estimatedArrival: Date; estimatedDurationMin: number } {
  // Simple calculation: time = distance / speed
  const flightTimeHours = distanceNm / cruiseSpeedKnots;
  const estimatedDurationMin = Math.round(flightTimeHours * 60);
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

    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { slug: { contains: search, mode: "insensitive" } },
        { aircraft: { name: { contains: search, mode: "insensitive" } } },
        { aircraft: { model: { contains: search, mode: "insensitive" } } },
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
              model: true,
              manufacturer: true,
              category: true,
              passengerCapacityMax: true,
              thumbnailImage: true,
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
      originalPriceNgn,
      discountPriceNgn,
    } = body;

    // Validation
    if (
      !aircraftId ||
      !departureAirportId ||
      !arrivalAirportId ||
      !departureDateTime ||
      !totalSeats ||
      !originalPriceNgn ||
      !discountPriceNgn
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

    const departureDT = new Date(departureDateTime);
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
        aircraftId,
        departureAirportId,
        arrivalAirportId,
        departureDateTime: departureDT,
        estimatedArrival,
        estimatedDurationMin,
        totalSeats: parseInt(totalSeats),
        availableSeats: parseInt(totalSeats),
        originalPriceNgn: parseFloat(originalPriceNgn),
        discountPriceNgn: parseFloat(discountPriceNgn),
        status: "PUBLISHED",
        createdByAdminId: payload.sub,
      },
      include: {
        aircraft: {
          select: { name: true, model: true },
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
          discountPriceNgn,
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

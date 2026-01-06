import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pexjet/database";
import { verifyAuth, unauthorizedResponse } from "@/lib/auth";

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

function generateSlug(departure: string, arrival: string, date: Date): string {
  const dateStr = formatDateForSlug(date);
  const slug = `${departure}-to-${arrival}-${dateStr}`
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-");
  return slug;
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
  const taxiAndOverheadMin = 30;

  // Adjust overhead based on distance
  let adjustedOverhead = taxiAndOverheadMin;
  if (distanceNm < 300) {
    adjustedOverhead = 25;
  } else if (distanceNm > 1500) {
    adjustedOverhead = 40;
  }

  const estimatedDurationMin = Math.round(cruiseTimeMin + adjustedOverhead);
  const estimatedArrival = new Date(
    departureDateTime.getTime() + estimatedDurationMin * 60 * 1000,
  );
  return { estimatedArrival, estimatedDurationMin };
}

export async function GET(request: NextRequest) {
  const operator = await verifyAuth(request);
  if (!operator) return unauthorizedResponse();

  try {
    const emptyLegs = await prisma.emptyLeg.findMany({
      where: { createdByOperatorId: operator.id },
      include: {
        departureAirport: {
          select: {
            name: true,
            municipality: true,
            iataCode: true,
          },
        },
        arrivalAirport: {
          select: {
            name: true,
            municipality: true,
            iataCode: true,
          },
        },
        aircraft: {
          select: {
            name: true,
            model: true,
          },
        },
        _count: {
          select: { bookings: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ emptyLegs });
  } catch (error) {
    console.error("Empty legs fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const operator = await verifyAuth(request);
  if (!operator) return unauthorizedResponse();

  try {
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
    } = body;

    // Validate required fields
    if (
      !aircraftId ||
      !departureAirportId ||
      !arrivalAirportId ||
      !departureDateTime ||
      !totalSeats ||
      !availableSeats ||
      !originalPrice ||
      !discountPrice
    ) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 },
      );
    }

    // Verify aircraft is in operator's fleet
    const fleetEntry = await prisma.operatorFleet.findFirst({
      where: {
        operatorId: operator.id,
        aircraftId,
      },
    });

    if (!fleetEntry) {
      return NextResponse.json(
        { error: "Aircraft not in your fleet" },
        { status: 400 },
      );
    }

    // Get airports and aircraft for calculations
    const [departureAirport, arrivalAirport, aircraft] = await Promise.all([
      prisma.airport.findUnique({
        where: { id: departureAirportId },
        select: {
          iataCode: true,
          icaoCode: true,
          municipality: true,
          latitude: true,
          longitude: true,
        },
      }),
      prisma.airport.findUnique({
        where: { id: arrivalAirportId },
        select: {
          iataCode: true,
          icaoCode: true,
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

    if (!departureAirport || !arrivalAirport) {
      return NextResponse.json({ error: "Invalid airport" }, { status: 400 });
    }

    if (!aircraft) {
      return NextResponse.json({ error: "Invalid aircraft" }, { status: 400 });
    }

    // Generate slug
    const depCode =
      departureAirport.iataCode ||
      departureAirport.icaoCode ||
      departureAirport.municipality;
    const arrCode =
      arrivalAirport.iataCode ||
      arrivalAirport.icaoCode ||
      arrivalAirport.municipality;
    // Parse datetime as local time (stored as UTC to preserve the exact time)
    const departureDate = parseLocalTimeAsUTC(departureDateTime);

    const baseSlug = generateSlug(
      depCode || "dep",
      arrCode || "arr",
      departureDate,
    );

    // Ensure unique slug
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.emptyLeg.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const emptyLeg = await prisma.emptyLeg.create({
      data: {
        slug,
        departureAirportId,
        arrivalAirportId,
        aircraftId,
        departureDateTime: departureDate,
        totalSeats,
        availableSeats,
        originalPrice,
        discountPrice,
        status: "PUBLISHED",
        createdByOperatorId: operator.id,
      },
      include: {
        departureAirport: true,
        arrivalAirport: true,
        aircraft: true,
      },
    });

    return NextResponse.json({
      message: "Empty leg created successfully",
      emptyLeg,
    });
  } catch (error) {
    console.error("Empty leg create error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

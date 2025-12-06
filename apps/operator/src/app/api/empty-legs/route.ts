import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pexjet/database";
import { verifyAuth, unauthorizedResponse } from "@/lib/auth";

function generateSlug(departure: string, arrival: string, date: Date): string {
  const dateStr = date.toISOString().split("T")[0];
  const slug = `${departure}-to-${arrival}-${dateStr}`
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-");
  return slug;
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
      originalPriceNgn,
      discountPriceNgn,
    } = body;

    // Validate required fields
    if (
      !aircraftId ||
      !departureAirportId ||
      !arrivalAirportId ||
      !departureDateTime ||
      !totalSeats ||
      !availableSeats ||
      !originalPriceNgn ||
      !discountPriceNgn
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

    // Get airports for slug
    const [departureAirport, arrivalAirport] = await Promise.all([
      prisma.airport.findUnique({
        where: { id: departureAirportId },
        select: { iataCode: true, icaoCode: true, municipality: true },
      }),
      prisma.airport.findUnique({
        where: { id: arrivalAirportId },
        select: { iataCode: true, icaoCode: true, municipality: true },
      }),
    ]);

    if (!departureAirport || !arrivalAirport) {
      return NextResponse.json({ error: "Invalid airport" }, { status: 400 });
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
    const baseSlug = generateSlug(
      depCode || "dep",
      arrCode || "arr",
      new Date(departureDateTime),
    );

    // Ensure unique slug
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.emptyLeg.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Calculate estimated arrival (rough estimate based on distance)
    const departureDate = new Date(departureDateTime);
    const estimatedDurationMin = 120; // Default 2 hours, should be calculated
    const estimatedArrival = new Date(
      departureDate.getTime() + estimatedDurationMin * 60 * 1000,
    );

    // Create empty leg
    const emptyLeg = await prisma.emptyLeg.create({
      data: {
        slug,
        departureAirportId,
        arrivalAirportId,
        aircraftId,
        departureDateTime: departureDate,
        estimatedArrival,
        estimatedDurationMin,
        totalSeats,
        availableSeats,
        originalPriceNgn,
        discountPriceNgn,
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

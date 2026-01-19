import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pexjet/database";
import { verifyAuth, unauthorizedResponse } from "@/lib/auth";

const MAX_FLEET_SIZE = 10;

export async function GET(request: NextRequest) {
  const operator = await verifyAuth(request);
  if (!operator) return unauthorizedResponse();

  try {
    const fleet = await prisma.operatorFleet.findMany({
      where: { operatorId: operator.id },
      include: {
        aircraft: {
          select: {
            id: true,
            name: true,
            manufacturer: true,
            model: true,
            category: true,
            passengerCapacityMin: true,
            passengerCapacityMax: true,
            rangeNm: true,
            cruiseSpeedKnots: true,
            thumbnailImage: true,
          },
        },
      },
    });

    // Transform to include fleetId
    const fleetWithIds = fleet.map((f) => ({
      ...f.aircraft,
      fleetId: f.id,
    }));

    return NextResponse.json({ fleet: fleetWithIds });
  } catch (error) {
    console.error("Fleet fetch error:", error);
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
    const { aircraftId } = await request.json();

    if (!aircraftId) {
      return NextResponse.json(
        { error: "Aircraft ID is required" },
        { status: 400 },
      );
    }

    // Check fleet size limit
    const currentFleetSize = await prisma.operatorFleet.count({
      where: { operatorId: operator.id },
    });

    if (currentFleetSize >= MAX_FLEET_SIZE) {
      return NextResponse.json(
        { error: `Fleet limit of ${MAX_FLEET_SIZE} aircraft reached` },
        { status: 400 },
      );
    }

    // Check if aircraft exists
    const aircraft = await prisma.aircraft.findUnique({
      where: { id: aircraftId },
    });

    if (!aircraft) {
      return NextResponse.json(
        { error: "Aircraft not found" },
        { status: 404 },
      );
    }

    // Check if already in fleet
    const existing = await prisma.operatorFleet.findUnique({
      where: {
        operatorId_aircraftId: {
          operatorId: operator.id,
          aircraftId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Aircraft already in fleet" },
        { status: 400 },
      );
    }

    // Add to fleet
    const fleetEntry = await prisma.operatorFleet.create({
      data: {
        operatorId: operator.id,
        aircraftId,
      },
      include: {
        aircraft: true,
      },
    });

    return NextResponse.json({
      message: "Aircraft added to fleet",
      fleet: fleetEntry,
    });
  } catch (error) {
    console.error("Fleet add error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

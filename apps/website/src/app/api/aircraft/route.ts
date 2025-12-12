import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pexjet/database";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const forDisplay = searchParams.get("forDisplay");

    // Build where clause
    const where: any = {};

    if (category) {
      where.category = category;
    }

    // Only get aircraft available for display (local, international, or both)
    if (forDisplay === "true") {
      where.availability = {
        in: ["LOCAL", "INTERNATIONAL", "BOTH"],
      };
    }

    const aircraft = await prisma.aircraft.findMany({
      where,
      select: {
        id: true,
        name: true,
        manufacturer: true,
        model: true,
        category: true,
        availability: true,
        // Specifications
        passengerCapacityMin: true,
        passengerCapacityMax: true,
        rangeNm: true,
        cruiseSpeedKnots: true,
        baggageCapacityCuFt: true,
        fuelCapacityGal: true,
        // Interior Dimensions
        cabinLengthFt: true,
        cabinWidthFt: true,
        cabinHeightFt: true,
        // Exterior Dimensions
        lengthFt: true,
        wingspanFt: true,
        heightFt: true,
        // Additional Info
        yearOfManufacture: true,
        hourlyRateUsd: true,
        description: true,
        // Images
        exteriorImages: true,
        interiorImages: true,
        thumbnailImage: true,
      },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    return NextResponse.json({
      aircraft,
      total: aircraft.length,
    });
  } catch (error: any) {
    console.error("Aircraft fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch aircraft" },
      { status: 500 },
    );
  }
}

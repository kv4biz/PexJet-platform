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
        passengerCapacityMin: true,
        passengerCapacityMax: true,
        rangeNm: true,
        cruiseSpeedKnots: true,
        cabinHeightFt: true,
        cabinWidthFt: true,
        cabinLengthFt: true,
        baggageCapacityCuFt: true,
        hourlyRateUsd: true,
        description: true,
        thumbnailImage: true,
        exteriorImages: true,
        interiorImages: true,
      },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    // Transform data to match frontend expectations
    const transformedAircraft = aircraft.map((a) => ({
      id: a.id,
      name: a.name,
      model: a.model,
      type: a.category,
      manufacturer: a.manufacturer,
      passengerCapacity: a.passengerCapacityMax || a.passengerCapacityMin || 0,
      luggageCapacity: a.baggageCapacityCuFt
        ? `${a.baggageCapacityCuFt} cu ft`
        : null,
      cruiseSpeed: a.cruiseSpeedKnots ? `${a.cruiseSpeedKnots} knots` : null,
      cruiseSpeedKnots: a.cruiseSpeedKnots || 0,
      range: a.rangeNm ? `${a.rangeNm} nm` : null,
      rangeNm: a.rangeNm || 0,
      cabinHeight: a.cabinHeightFt ? `${a.cabinHeightFt} ft` : null,
      cabinWidth: a.cabinWidthFt ? `${a.cabinWidthFt} ft` : null,
      cabinLength: a.cabinLengthFt ? `${a.cabinLengthFt} ft` : null,
      hourlyRateUsd: a.hourlyRateUsd || 0,
      exteriorImages: a.exteriorImages || [],
      interiorImages: a.interiorImages || [],
      // Derive availability flags from enum
      availableForLocal:
        a.availability === "LOCAL" || a.availability === "BOTH",
      availableForInternational:
        a.availability === "INTERNATIONAL" || a.availability === "BOTH",
    }));

    return NextResponse.json({
      aircraft: transformedAircraft,
      total: transformedAircraft.length,
    });
  } catch (error: any) {
    console.error("Aircraft fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch aircraft" },
      { status: 500 },
    );
  }
}

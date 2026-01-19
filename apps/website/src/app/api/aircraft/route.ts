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

    const aircraftData = await prisma.aircraft.findMany({
      where,
      select: {
        id: true,
        name: true,
        manufacturer: true,
        category: true,
        availability: true,
        // Specifications
        minPax: true,
        maxPax: true,
        rangeNm: true,
        cruiseSpeedKnots: true,
        baggageCuFt: true,
        fuelCapacityGal: true,
        // Interior Dimensions
        cabinLengthFt: true,
        cabinWidthFt: true,
        cabinHeightFt: true,
        // Exterior Dimensions
        exteriorLengthFt: true,
        exteriorWingspanFt: true,
        exteriorHeightFt: true,
        // Additional Info
        basePricePerHour: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    // Transform data to match frontend expectations
    const aircraft = aircraftData.map((a) => ({
      id: a.id,
      name: a.name,
      manufacturer: a.manufacturer,
      model: null, // Not available in schema
      type: a.category
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase()),
      category: a.category,
      availability: a.availability,
      // Database fields (exact match)
      basePricePerHour: a.basePricePerHour,
      cabinLengthFt: a.cabinLengthFt,
      cabinWidthFt: a.cabinWidthFt,
      cabinHeightFt: a.cabinHeightFt,
      baggageCuFt: a.baggageCuFt,
      exteriorHeightFt: a.exteriorHeightFt,
      exteriorLengthFt: a.exteriorLengthFt,
      exteriorWingspanFt: a.exteriorWingspanFt,
      image: a.image,
      maxPax: a.maxPax,
      minPax: a.minPax,
      cruiseSpeedKnots: a.cruiseSpeedKnots,
      fuelCapacityGal: a.fuelCapacityGal,
      rangeNm: a.rangeNm,
      // Transformed availability flags
      availableForLocal:
        a.availability === "LOCAL" || a.availability === "BOTH",
      availableForInternational:
        a.availability === "INTERNATIONAL" || a.availability === "BOTH",
      // Legacy fields for backward compatibility
      passengerCapacity: a.maxPax || 0,
      luggageCapacity: a.baggageCuFt ? `${a.baggageCuFt} cu ft` : null,
      range: a.rangeNm ? `${a.rangeNm.toLocaleString()} nm` : null,
      cruiseSpeed: a.cruiseSpeedKnots ? `${a.cruiseSpeedKnots} kts` : null,
      cabinLength: a.cabinLengthFt ? `${a.cabinLengthFt} ft` : null,
      cabinWidth: a.cabinWidthFt ? `${a.cabinWidthFt} ft` : null,
      cabinHeight: a.cabinHeightFt ? `${a.cabinHeightFt} ft` : null,
      hourlyRateUsd: a.basePricePerHour || 0,
      exteriorImages: a.image ? [a.image] : [],
      interiorImages: [], // Not available in schema
    }));

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

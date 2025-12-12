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

    // Transform data to match frontend expectations
    const aircraft = aircraftData.map((a) => ({
      id: a.id,
      name: a.name,
      manufacturer: a.manufacturer,
      model: a.model,
      type: a.category
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase()),
      category: a.category,
      availability: a.availability,
      // Transformed availability flags
      availableForLocal:
        a.availability === "LOCAL" || a.availability === "BOTH",
      availableForInternational:
        a.availability === "INTERNATIONAL" || a.availability === "BOTH",
      // Specifications
      passengerCapacity: a.passengerCapacityMax,
      passengerCapacityMin: a.passengerCapacityMin,
      passengerCapacityMax: a.passengerCapacityMax,
      rangeNm: a.rangeNm,
      range: a.rangeNm ? `${a.rangeNm.toLocaleString()} nm` : null,
      cruiseSpeedKnots: a.cruiseSpeedKnots,
      cruiseSpeed: a.cruiseSpeedKnots ? `${a.cruiseSpeedKnots} kts` : null,
      luggageCapacity: a.baggageCapacityCuFt
        ? `${a.baggageCapacityCuFt} cu ft`
        : null,
      baggageCapacityCuFt: a.baggageCapacityCuFt,
      fuelCapacityGal: a.fuelCapacityGal,
      // Interior Dimensions
      cabinLengthFt: a.cabinLengthFt,
      cabinWidthFt: a.cabinWidthFt,
      cabinHeightFt: a.cabinHeightFt,
      cabinLength: a.cabinLengthFt ? `${a.cabinLengthFt} ft` : null,
      cabinWidth: a.cabinWidthFt ? `${a.cabinWidthFt} ft` : null,
      cabinHeight: a.cabinHeightFt ? `${a.cabinHeightFt} ft` : null,
      // Exterior Dimensions
      lengthFt: a.lengthFt,
      wingspanFt: a.wingspanFt,
      heightFt: a.heightFt,
      // Additional Info
      yearOfManufacture: a.yearOfManufacture,
      hourlyRateUsd: a.hourlyRateUsd,
      description: a.description,
      // Images
      exteriorImages: a.exteriorImages,
      interiorImages: a.interiorImages,
      thumbnailImage: a.thumbnailImage,
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

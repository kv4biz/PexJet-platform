// apps/website/src/app/api/external/empty-legs/[slug]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pexjet/database";

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const emptyLeg = await prisma.emptyLeg.findUnique({
      where: {
        slug: params.slug,
        status: "PUBLISHED",
      },
      include: {
        departureAirport: {
          select: {
            id: true,
            name: true,
            municipality: true,
            iataCode: true,
            icaoCode: true,
            latitude: true,
            longitude: true,
            country: { select: { name: true } },
          },
        },
        arrivalAirport: {
          select: {
            id: true,
            name: true,
            municipality: true,
            iataCode: true,
            icaoCode: true,
            latitude: true,
            longitude: true,
            country: { select: { name: true } },
          },
        },
        aircraft: true,
      },
    });

    if (!emptyLeg) {
      return NextResponse.json({ error: "Empty leg not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: emptyLeg.id,
      slug: emptyLeg.slug,
      aircraft: emptyLeg.aircraft
        ? {
            id: emptyLeg.aircraft.id,
            name: emptyLeg.aircraft.name,
            manufacturer: emptyLeg.aircraft.manufacturer,
            category: emptyLeg.aircraft.category,
            maxPax: emptyLeg.aircraft.maxPax,
            image: emptyLeg.aircraft.image,

            cabinLengthFt: emptyLeg.aircraft.cabinLengthFt,
            cabinWidthFt: emptyLeg.aircraft.cabinWidthFt,
            cabinHeightFt: emptyLeg.aircraft.cabinHeightFt,

            exteriorLengthFt: emptyLeg.aircraft.exteriorLengthFt,
            exteriorWingspanFt: emptyLeg.aircraft.exteriorWingspanFt,
            exteriorHeightFt: emptyLeg.aircraft.exteriorHeightFt,

            baggageCuFt: emptyLeg.aircraft.baggageCuFt,
            fuelCapacityGal: emptyLeg.aircraft.fuelCapacityGal,
            rangeNm: emptyLeg.aircraft.rangeNm,
            cruiseSpeedKnots: emptyLeg.aircraft.cruiseSpeedKnots,

            availability: emptyLeg.aircraft.availability,

            createdAt: emptyLeg.aircraft.createdAt,
            updatedAt: emptyLeg.aircraft.updatedAt,
          }
        : emptyLeg.aircraftName
          ? {
              id: null,
              name: emptyLeg.aircraftName,
              manufacturer: null,
              category: emptyLeg.aircraftCategory,
              maxPax: emptyLeg.totalSeats,
              image: emptyLeg.aircraftImage,

              cabinLengthFt: null,
              cabinWidthFt: null,
              cabinHeightFt: null,
              exteriorLengthFt: null,
              exteriorWingspanFt: null,
              exteriorHeightFt: null,
              baggageCuFt: null,
              fuelCapacityGal: null,
              rangeNm: null,
              cruiseSpeedKnots: null,
              availability: null,

              createdAt: null,
              updatedAt: null,
            }
          : null,
      departureDate: emptyLeg.departureDateTime.toISOString(),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch empty leg" }, { status: 500 });
  }
}

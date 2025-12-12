import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pexjet/database";

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } },
) {
  try {
    const { slug } = params;

    // Get exchange rate from settings
    const settings = await prisma.settings.findUnique({
      where: { id: "default" },
      select: { usdToNgnRate: true },
    });
    const exchangeRate = settings?.usdToNgnRate || 1650;

    const emptyLeg = await prisma.emptyLeg.findUnique({
      where: { slug },
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
            country: {
              select: { name: true },
            },
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
            country: {
              select: { name: true },
            },
          },
        },
        aircraft: {
          select: {
            id: true,
            name: true,
            manufacturer: true,
            model: true,
            category: true,
            passengerCapacityMax: true,
            exteriorImages: true,
            interiorImages: true,
            thumbnailImage: true,
          },
        },
        createdByAdmin: {
          select: { id: true, fullName: true },
        },
        createdByOperator: {
          select: { id: true, fullName: true },
        },
      },
    });

    if (!emptyLeg) {
      return NextResponse.json(
        { error: "Empty leg not found" },
        { status: 404 },
      );
    }

    // Check if it's still available
    if (
      emptyLeg.status !== "PUBLISHED" ||
      new Date(emptyLeg.departureDateTime) < new Date()
    ) {
      return NextResponse.json(
        { error: "This deal is no longer available" },
        { status: 410 },
      );
    }

    const discountPercent = Math.round(
      ((emptyLeg.originalPrice - emptyLeg.discountPrice) /
        emptyLeg.originalPrice) *
        100,
    );

    const transformedLeg = {
      id: emptyLeg.id,
      slug: emptyLeg.slug,
      departureAirport: {
        id: emptyLeg.departureAirport.id,
        name: emptyLeg.departureAirport.name,
        city: emptyLeg.departureAirport.municipality || "",
        country: emptyLeg.departureAirport.country?.name || "",
        code:
          emptyLeg.departureAirport.iataCode ||
          emptyLeg.departureAirport.icaoCode ||
          "",
        latitude: emptyLeg.departureAirport.latitude,
        longitude: emptyLeg.departureAirport.longitude,
      },
      arrivalAirport: {
        id: emptyLeg.arrivalAirport.id,
        name: emptyLeg.arrivalAirport.name,
        city: emptyLeg.arrivalAirport.municipality || "",
        country: emptyLeg.arrivalAirport.country?.name || "",
        code:
          emptyLeg.arrivalAirport.iataCode ||
          emptyLeg.arrivalAirport.icaoCode ||
          "",
        latitude: emptyLeg.arrivalAirport.latitude,
        longitude: emptyLeg.arrivalAirport.longitude,
      },
      aircraft: {
        id: emptyLeg.aircraft.id,
        name: emptyLeg.aircraft.name,
        manufacturer: emptyLeg.aircraft.manufacturer,
        model: emptyLeg.aircraft.model,
        category: emptyLeg.aircraft.category,
        maxPassengers: emptyLeg.aircraft.passengerCapacityMax,
        images: emptyLeg.aircraft.thumbnailImage
          ? [
              emptyLeg.aircraft.thumbnailImage,
              ...emptyLeg.aircraft.exteriorImages,
              ...emptyLeg.aircraft.interiorImages,
            ]
          : [
              ...emptyLeg.aircraft.exteriorImages,
              ...emptyLeg.aircraft.interiorImages,
            ],
      },
      departureDate: emptyLeg.departureDateTime.toISOString(),
      availableSeats: emptyLeg.availableSeats,
      totalSeats: emptyLeg.totalSeats,
      priceNgn: emptyLeg.discountPrice,
      originalPriceNgn: emptyLeg.originalPrice,
      priceUsd: Math.round((emptyLeg.discountPrice / exchangeRate) * 100) / 100,
      originalPriceUsd:
        Math.round((emptyLeg.originalPrice / exchangeRate) * 100) / 100,
      discountPercent,
      ownerType: emptyLeg.createdByOperatorId ? "operator" : "admin",
      createdByAdminId: emptyLeg.createdByAdminId,
      createdByOperatorId: emptyLeg.createdByOperatorId,
    };

    return NextResponse.json({
      emptyLeg: transformedLeg,
      exchangeRate,
    });
  } catch (error: any) {
    console.error("Empty leg fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch empty leg" },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pexjet/database";

// Haversine formula to calculate distance between two coordinates in km
function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Earth's radius in km
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
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "PUBLISHED";

    // Search filters
    const fromQuery = searchParams.get("from");
    const toQuery = searchParams.get("to");
    const fromRadius = parseInt(searchParams.get("fromRadius") || "0");
    const toRadius = parseInt(searchParams.get("toRadius") || "0");
    const minDiscount = parseInt(searchParams.get("minDiscount") || "0");
    const maxPrice = parseFloat(searchParams.get("maxPrice") || "0");
    const date = searchParams.get("date");
    const passengers = parseInt(searchParams.get("passengers") || "0");

    // Sorting
    const sortBy = searchParams.get("sortBy") || "date"; // date, price, discount, alphabetic, cheapest
    const sortOrder = searchParams.get("sortOrder") || "asc";

    // Prices are now in USD directly, no conversion needed

    // Build where clause
    const where: any = {
      status: status as any,
      departureDateTime: {
        gte: new Date(),
      },
    };

    // Filter by date if provided
    if (date) {
      const searchDate = new Date(date);
      const nextDay = new Date(searchDate);
      nextDay.setDate(nextDay.getDate() + 1);
      where.departureDateTime = {
        gte: searchDate,
        lt: nextDay,
      };
    }

    // Filter by passengers
    if (passengers > 0) {
      where.availableSeats = {
        gte: passengers,
      };
    }

    const emptyLegs = await prisma.emptyLeg.findMany({
      where,
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
              select: {
                name: true,
              },
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
              select: {
                name: true,
              },
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

    // Transform and filter data
    let transformedLegs = emptyLegs.map((leg: any) => {
      const discountPercent = Math.round(
        ((leg.originalPriceUsd - leg.discountPriceUsd) / leg.originalPriceUsd) *
          100,
      );

      return {
        id: leg.id,
        slug: leg.slug,
        departureAirport: {
          id: leg.departureAirport.id,
          name: leg.departureAirport.name,
          city: leg.departureAirport.municipality || "",
          country: leg.departureAirport.country?.name || "",
          code:
            leg.departureAirport.iataCode ||
            leg.departureAirport.icaoCode ||
            "",
          latitude: leg.departureAirport.latitude,
          longitude: leg.departureAirport.longitude,
        },
        arrivalAirport: {
          id: leg.arrivalAirport.id,
          name: leg.arrivalAirport.name,
          city: leg.arrivalAirport.municipality || "",
          country: leg.arrivalAirport.country?.name || "",
          code:
            leg.arrivalAirport.iataCode || leg.arrivalAirport.icaoCode || "",
          latitude: leg.arrivalAirport.latitude,
          longitude: leg.arrivalAirport.longitude,
        },
        aircraft: {
          id: leg.aircraft.id,
          name: leg.aircraft.name,
          manufacturer: leg.aircraft.manufacturer,
          model: leg.aircraft.model,
          category: leg.aircraft.category,
          maxPassengers: leg.aircraft.passengerCapacityMax,
          images: leg.aircraft.thumbnailImage
            ? [leg.aircraft.thumbnailImage, ...leg.aircraft.exteriorImages]
            : leg.aircraft.exteriorImages,
        },
        departureDate: leg.departureDateTime.toISOString(),
        availableSeats: leg.availableSeats,
        totalSeats: leg.totalSeats,
        // Pricing (USD)
        priceUsd: leg.discountPriceUsd,
        originalPriceUsd: leg.originalPriceUsd,
        discountPercent,
        status: leg.status,
        // Owner info
        createdByAdminId: leg.createdByAdminId,
        createdByOperatorId: leg.createdByOperatorId,
        ownerType: leg.createdByOperatorId ? "operator" : "admin",
      };
    });

    // Apply radius filter for departure
    if (fromQuery && fromRadius > 0) {
      // Find the reference airport
      const fromCode = fromQuery.split(" - ")[0]?.trim();
      const refAirport = await prisma.airport.findFirst({
        where: {
          OR: [{ iataCode: fromCode }, { icaoCode: fromCode }],
        },
        select: { latitude: true, longitude: true },
      });

      if (refAirport) {
        transformedLegs = transformedLegs.filter((leg: any) => {
          const distance = calculateDistanceKm(
            refAirport.latitude,
            refAirport.longitude,
            leg.departureAirport.latitude,
            leg.departureAirport.longitude,
          );
          return distance <= fromRadius;
        });
      }
    }

    // Apply radius filter for arrival
    if (toQuery && toRadius > 0) {
      const toCode = toQuery.split(" - ")[0]?.trim();
      const refAirport = await prisma.airport.findFirst({
        where: {
          OR: [{ iataCode: toCode }, { icaoCode: toCode }],
        },
        select: { latitude: true, longitude: true },
      });

      if (refAirport) {
        transformedLegs = transformedLegs.filter((leg: any) => {
          const distance = calculateDistanceKm(
            refAirport.latitude,
            refAirport.longitude,
            leg.arrivalAirport.latitude,
            leg.arrivalAirport.longitude,
          );
          return distance <= toRadius;
        });
      }
    }

    // Filter by minimum discount
    if (minDiscount > 0) {
      transformedLegs = transformedLegs.filter(
        (leg: any) => leg.discountPercent >= minDiscount,
      );
    }

    // Filter by max price (in USD)
    if (maxPrice > 0) {
      transformedLegs = transformedLegs.filter(
        (leg: any) => leg.priceUsd <= maxPrice,
      );
    }

    // Sorting
    transformedLegs.sort((a: any, b: any) => {
      let comparison = 0;

      switch (sortBy) {
        case "price":
        case "cheapest":
          comparison = a.priceNgn - b.priceNgn;
          break;
        case "discount":
          comparison = b.discountPercent - a.discountPercent; // Higher discount first
          break;
        case "alphabetic":
          comparison = a.departureAirport.city.localeCompare(
            b.departureAirport.city,
          );
          break;
        case "date":
        default:
          comparison =
            new Date(a.departureDateTime).getTime() -
            new Date(b.departureDateTime).getTime();
          break;
      }

      return sortOrder === "desc" ? -comparison : comparison;
    });

    return NextResponse.json({
      emptyLegs: transformedLegs,
      total: transformedLegs.length,
    });
  } catch (error: any) {
    console.error("Empty legs fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch empty legs" },
      { status: 500 },
    );
  }
}

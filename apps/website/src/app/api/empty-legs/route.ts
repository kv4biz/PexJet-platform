import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pexjet/database";

// Helper function to get airport by ICAO code
async function getAirportByIcao(icao: string | null | undefined) {
  if (!icao) {
    return {
      id: "",
      name: "Unknown Airport",
      city: "",
      country: "",
      code: "",
      latitude: 0,
      longitude: 0,
    };
  }

  try {
    const airport = await prisma.airport.findFirst({
      where: { icaoCode: icao },
      select: {
        id: true,
        name: true,
        municipality: true,
        countryCode: true,
        iataCode: true,
        icaoCode: true,
        latitude: true,
        longitude: true,
      },
    });

    if (airport) {
      return {
        id: airport.id,
        name: airport.name,
        city: airport.municipality || "",
        country: airport.countryCode || "",
        code: airport.iataCode || airport.icaoCode || "",
        latitude: airport.latitude,
        longitude: airport.longitude,
      };
    }
  } catch (error) {
    console.error(`Error finding airport by ICAO ${icao}:`, error);
  }

  // Fallback if not found
  return {
    id: "",
    name: `${icao} Airport`,
    city: "",
    country: "",
    code: icao,
    latitude: 0,
    longitude: 0,
  };
}

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
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const priceType = searchParams.get("priceType");

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

    // Filter by date range if provided
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);

      let end;
      if (endDate) {
        end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
      } else {
        // Default to 90 days from start date if no end date provided
        end = new Date(start);
        end.setDate(end.getDate() + 90);
        end.setHours(23, 59, 59, 999);
      }

      // Ensure startDate is not in the past
      const now = new Date();
      where.departureDateTime = {
        gte: start > now ? start : now,
        lte: end,
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
            category: true,
            maxPax: true,
            image: true,
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

    console.log("Found empty legs:", emptyLegs.length);
    console.log("Sample leg:", JSON.stringify(emptyLegs[0], null, 2));

    // Transform and filter data
    let transformedLegs = await Promise.all(
      emptyLegs.map(async (leg: any) => {
        try {
          // Handle pricing based on priceType and priceUsd
          let displayPrice = null;
          let displayText = "";

          if (leg.priceType === "CONTACT") {
            displayText = "Contact for price";
          } else if (
            leg.priceType === "FIXED" &&
            leg.priceUsd &&
            leg.priceUsd > 0
          ) {
            displayPrice = leg.priceUsd;
            displayText = `$${leg.priceUsd.toLocaleString()}`;
          } else {
            displayText = "Contact for price";
          }

          // Get airport data - use lookup for InstaCharter deals
          const departureAirport = leg.departureAirport
            ? {
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
              }
            : await getAirportByIcao(leg.departureIcao);

          const arrivalAirport = leg.arrivalAirport
            ? {
                id: leg.arrivalAirport.id,
                name: leg.arrivalAirport.name,
                city: leg.arrivalAirport.municipality || "",
                country: leg.arrivalAirport.country?.name || "",
                code:
                  leg.arrivalAirport.iataCode ||
                  leg.arrivalAirport.icaoCode ||
                  "",
                latitude: leg.arrivalAirport.latitude,
                longitude: leg.arrivalAirport.longitude,
              }
            : await getAirportByIcao(leg.arrivalIcao);

          return {
            id: leg.id,
            slug: leg.slug,
            departureAirport,
            arrivalAirport,
            aircraft: {
              id: leg.aircraft?.id || "",
              name: leg.aircraftName || leg.aircraft?.name || "",
              manufacturer: leg.aircraft?.manufacturer || "",
              model: leg.aircraftType || "",
              category: leg.aircraftCategory || leg.aircraft?.category || "",
              maxPassengers: leg.aircraft?.maxPax || 0,
              images: leg.aircraftImage
                ? [leg.aircraftImage]
                : leg.aircraft?.image
                  ? [leg.aircraft.image]
                  : [],
            },
            departureDate: leg.departureDateTime.toISOString(),
            availableSeats: leg.availableSeats || 0,
            totalSeats: leg.totalSeats || 0,
            // Pricing - simplified based on schema
            priceUsd: displayPrice,
            priceText: displayText,
            priceType: leg.priceType,
            status: leg.status,
            // Owner info
            createdByAdminId: leg.createdByAdminId,
            createdByOperatorId: leg.createdByOperatorId,
            ownerType: leg.createdByOperatorId ? "operator" : "admin",
          };
        } catch (error) {
          console.error("Error transforming leg:", leg.id, error);
          return null;
        }
      }),
    );

    // Remove any null entries from failed transformations
    transformedLegs = transformedLegs.filter(Boolean);

    // Apply departure and arrival airport filters with OR logic
    let departureFilteredLegs = [...transformedLegs];
    let arrivalFilteredLegs = [...transformedLegs];

    // Apply departure airport filter
    if (fromQuery) {
      const fromCode = fromQuery.split(" - ")[0]?.trim().toUpperCase();
      const fromCity = fromQuery.split(" - ")[1]?.trim().toLowerCase();

      if (fromRadius > 0) {
        // Find the reference airport for radius search
        const refAirport = await prisma.airport.findFirst({
          where: {
            OR: [{ iataCode: fromCode }, { icaoCode: fromCode }],
          },
          select: { latitude: true, longitude: true },
        });

        if (refAirport) {
          departureFilteredLegs = departureFilteredLegs.filter((leg: any) => {
            const distance = calculateDistanceKm(
              refAirport.latitude,
              refAirport.longitude,
              leg.departureAirport.latitude,
              leg.departureAirport.longitude,
            );
            return distance <= fromRadius;
          });
        }
      } else {
        // Exact or partial match on airport code, city, or country
        departureFilteredLegs = departureFilteredLegs.filter((leg: any) => {
          const legCode = leg.departureAirport.code?.toUpperCase() || "";
          const legCity = leg.departureAirport.city?.toLowerCase() || "";
          const legCountry = leg.departureAirport.country?.toLowerCase() || "";
          const legName = leg.departureAirport.name?.toLowerCase() || "";

          return (
            legCode === fromCode ||
            legCity.includes(fromCity || fromCode.toLowerCase()) ||
            legCountry.includes(fromCity || fromCode.toLowerCase()) ||
            legName.includes(fromCity || fromCode.toLowerCase())
          );
        });
      }
    }

    // Apply arrival airport filter
    if (toQuery) {
      const toCode = toQuery.split(" - ")[0]?.trim().toUpperCase();
      const toCity = toQuery.split(" - ")[1]?.trim().toLowerCase();

      if (toRadius > 0) {
        const refAirport = await prisma.airport.findFirst({
          where: {
            OR: [{ iataCode: toCode }, { icaoCode: toCode }],
          },
          select: { latitude: true, longitude: true },
        });

        if (refAirport) {
          arrivalFilteredLegs = arrivalFilteredLegs.filter((leg: any) => {
            const distance = calculateDistanceKm(
              refAirport.latitude,
              refAirport.longitude,
              leg.arrivalAirport.latitude,
              leg.arrivalAirport.longitude,
            );
            return distance <= toRadius;
          });
        }
      } else {
        // Exact or partial match on airport code, city, or country
        arrivalFilteredLegs = arrivalFilteredLegs.filter((leg: any) => {
          const legCode = leg.arrivalAirport.code?.toUpperCase() || "";
          const legCity = leg.arrivalAirport.city?.toLowerCase() || "";
          const legCountry = leg.arrivalAirport.country?.toLowerCase() || "";
          const legName = leg.arrivalAirport.name?.toLowerCase() || "";

          return (
            legCode === toCode ||
            legCity.includes(toCity || toCode.toLowerCase()) ||
            legCountry.includes(toCity || toCode.toLowerCase()) ||
            legName.includes(toCity || toCode.toLowerCase())
          );
        });
      }
    }

    // Combine results using OR logic
    if (fromQuery && toQuery) {
      // Both filters applied - use OR logic
      const departureIds = new Set(
        departureFilteredLegs.map((leg: any) => leg.id),
      );
      const arrivalIds = new Set(arrivalFilteredLegs.map((leg: any) => leg.id));

      transformedLegs = transformedLegs.filter(
        (leg: any) => departureIds.has(leg.id) || arrivalIds.has(leg.id),
      );
    } else if (fromQuery) {
      // Only departure filter applied
      transformedLegs = departureFilteredLegs;
    } else if (toQuery) {
      // Only arrival filter applied
      transformedLegs = arrivalFilteredLegs;
    }
    // If neither filter applied, keep all legs

    // Filter by minimum discount - REMOVED since we don't have discount logic anymore
    // if (minDiscount > 0) {
    //   transformedLegs = transformedLegs.filter(
    //     (leg: any) => leg.discountPercent >= minDiscount,
    //   );
    // }

    // Filter by max price (in USD)
    if (maxPrice > 0) {
      transformedLegs = transformedLegs.filter(
        (leg: any) => leg.priceUsd && leg.priceUsd <= maxPrice,
      );
    }

    // Filter by price type
    if (priceType && priceType !== "all") {
      transformedLegs = transformedLegs.filter((leg: any) => {
        if (priceType === "fixed") {
          return leg.priceType === "FIXED" && leg.priceUsd !== null;
        } else if (priceType === "contact") {
          return leg.priceType === "CONTACT" || leg.priceUsd === null;
        }
        return true;
      });
    }

    // Sorting
    transformedLegs.sort((a: any, b: any) => {
      let comparison = 0;

      switch (sortBy) {
        case "price":
        case "cheapest":
          // Handle null prices - put CONTACT type at the end
          if (!a.priceUsd && !b.priceUsd) comparison = 0;
          else if (!a.priceUsd) comparison = 1;
          else if (!b.priceUsd) comparison = -1;
          else comparison = a.priceUsd - b.priceUsd;
          break;
        case "discount":
          // REMOVED - no discount logic
          comparison = 0;
          break;
        case "alphabetic":
          comparison = a.departureAirport.city.localeCompare(
            b.departureAirport.city,
          );
          break;
        case "date":
        default:
          comparison =
            new Date(a.departureDate).getTime() -
            new Date(b.departureDate).getTime();
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

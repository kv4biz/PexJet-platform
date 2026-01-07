import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pexjet/database";

/**
 * Format a Date object as a local time string (YYYY-MM-DDTHH:MM:SS).
 * Since we store dates as UTC but they represent local time at the departure airport,
 * we use getUTC* methods to extract the values without timezone conversion.
 */
function formatLocalDateTime(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const seconds = String(date.getUTCSeconds()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

// Helper function to get airport by ICAO code with full database info
// Searches both icaoCode and gpsCode fields (they contain the same type of codes)
// Returns iataCode with localCode as fallback (they contain the same type of codes)
async function getAirportByIcao(icao: string | null | undefined) {
  if (!icao) {
    return {
      id: "",
      name: "Unknown Airport",
      city: "",
      region: "",
      country: "",
      iataCode: "",
      icaoCode: "",
      latitude: 0,
      longitude: 0,
    };
  }

  const code = icao.toUpperCase();

  try {
    // Search both icaoCode and gpsCode fields
    const airport = await prisma.airport.findFirst({
      where: {
        OR: [{ icaoCode: code }, { gpsCode: code }],
      },
      select: {
        id: true,
        name: true,
        municipality: true,
        countryCode: true,
        iataCode: true,
        icaoCode: true,
        localCode: true,
        latitude: true,
        longitude: true,
        region: {
          select: {
            name: true,
          },
        },
        country: {
          select: {
            name: true,
          },
        },
      },
    });

    if (airport) {
      // Use iataCode, fallback to localCode (both contain IATA-style codes)
      const displayCode = airport.iataCode || airport.localCode || "";
      return {
        id: airport.id,
        name: airport.name,
        city: airport.municipality || "",
        region: airport.region?.name || "",
        country: airport.country?.name || airport.countryCode || "",
        iataCode: displayCode,
        icaoCode: airport.icaoCode || "",
        latitude: airport.latitude,
        longitude: airport.longitude,
      };
    }
  } catch (error) {
    console.error(`Error finding airport by ICAO/GPS ${code}:`, error);
  }

  // Fallback if not found
  return {
    id: "",
    name: `${icao} Airport`,
    city: "",
    region: "",
    country: "",
    iataCode: "",
    icaoCode: icao,
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

    // Homepage optimization: only load deals within 3 days with prices, limit 20
    const forHomepage = searchParams.get("homepage") === "true";

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
        gte: new Date(), // Only future flights
      },
      availableSeats: {
        gt: 0, // Only deals with available seats
      },
    };

    // Homepage optimization: only deals with prices and within 3 days
    if (forHomepage) {
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
      threeDaysFromNow.setHours(23, 59, 59, 999);

      where.departureDateTime = {
        gte: new Date(),
        lte: threeDaysFromNow,
      };
      // Only show deals with actual prices (not "Contact for price")
      where.priceType = "FIXED";
      where.priceUsd = { gt: 0 };
    }

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
      // Limit results for homepage to improve performance
      ...(forHomepage && { take: 20 }),
      orderBy: { departureDateTime: "asc" },
      include: {
        departureAirport: {
          select: {
            id: true,
            name: true,
            municipality: true,
            iataCode: true,
            icaoCode: true,
            localCode: true,
            latitude: true,
            longitude: true,
            region: {
              select: {
                name: true,
              },
            },
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
            localCode: true,
            latitude: true,
            longitude: true,
            region: {
              select: {
                name: true,
              },
            },
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

          // Get airport data - prioritize IATA codes (with localCode fallback)
          // If no IATA code or localCode, lookup by ICAO/GPS to get complete airport info
          let departureAirport;
          if (leg.departureAirport) {
            // Use iataCode, fallback to localCode (both contain IATA-style codes)
            const depIataCode =
              leg.departureAirport.iataCode ||
              leg.departureAirport.localCode ||
              "";

            // Check if we need to lookup for IATA code
            if (!depIataCode && leg.departureAirport.icaoCode) {
              const fullAirportData = await getAirportByIcao(
                leg.departureAirport.icaoCode,
              );
              departureAirport = {
                id: leg.departureAirport.id,
                name: leg.departureAirport.name,
                city: leg.departureAirport.municipality || fullAirportData.city,
                region:
                  leg.departureAirport.region?.name || fullAirportData.region,
                country:
                  leg.departureAirport.country?.name || fullAirportData.country,
                iataCode: fullAirportData.iataCode || "",
                icaoCode: leg.departureAirport.icaoCode || "",
                latitude: leg.departureAirport.latitude,
                longitude: leg.departureAirport.longitude,
              };
            } else {
              departureAirport = {
                id: leg.departureAirport.id,
                name: leg.departureAirport.name,
                city: leg.departureAirport.municipality || "",
                region: leg.departureAirport.region?.name || "",
                country: leg.departureAirport.country?.name || "",
                iataCode: depIataCode,
                icaoCode: leg.departureAirport.icaoCode || "",
                latitude: leg.departureAirport.latitude,
                longitude: leg.departureAirport.longitude,
              };
            }
          } else {
            departureAirport = await getAirportByIcao(leg.departureIcao);
          }

          let arrivalAirport;
          if (leg.arrivalAirport) {
            // Use iataCode, fallback to localCode (both contain IATA-style codes)
            const arrIataCode =
              leg.arrivalAirport.iataCode || leg.arrivalAirport.localCode || "";

            // Check if we need to lookup for IATA code
            if (!arrIataCode && leg.arrivalAirport.icaoCode) {
              const fullAirportData = await getAirportByIcao(
                leg.arrivalAirport.icaoCode,
              );
              arrivalAirport = {
                id: leg.arrivalAirport.id,
                name: leg.arrivalAirport.name,
                city: leg.arrivalAirport.municipality || fullAirportData.city,
                region:
                  leg.arrivalAirport.region?.name || fullAirportData.region,
                country:
                  leg.arrivalAirport.country?.name || fullAirportData.country,
                iataCode: fullAirportData.iataCode || "",
                icaoCode: leg.arrivalAirport.icaoCode || "",
                latitude: leg.arrivalAirport.latitude,
                longitude: leg.arrivalAirport.longitude,
              };
            } else {
              arrivalAirport = {
                id: leg.arrivalAirport.id,
                name: leg.arrivalAirport.name,
                city: leg.arrivalAirport.municipality || "",
                region: leg.arrivalAirport.region?.name || "",
                country: leg.arrivalAirport.country?.name || "",
                iataCode: arrIataCode,
                icaoCode: leg.arrivalAirport.icaoCode || "",
                latitude: leg.arrivalAirport.latitude,
                longitude: leg.arrivalAirport.longitude,
              };
            }
          } else {
            arrivalAirport = await getAirportByIcao(leg.arrivalIcao);
          }

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
            // Format as local time string (stored as UTC but represents local time)
            departureDate: formatLocalDateTime(leg.departureDateTime),
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
            // Source for distinguishing InstaCharter deals
            source: leg.source,
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
          const legIata = leg.departureAirport.iataCode?.toUpperCase() || "";
          const legIcao = leg.departureAirport.icaoCode?.toUpperCase() || "";
          const legCity = leg.departureAirport.city?.toLowerCase() || "";
          const legCountry = leg.departureAirport.country?.toLowerCase() || "";
          const legName = leg.departureAirport.name?.toLowerCase() || "";

          return (
            legIata === fromCode ||
            legIcao === fromCode ||
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
          const legIata = leg.arrivalAirport.iataCode?.toUpperCase() || "";
          const legIcao = leg.arrivalAirport.icaoCode?.toUpperCase() || "";
          const legCity = leg.arrivalAirport.city?.toLowerCase() || "";
          const legCountry = leg.arrivalAirport.country?.toLowerCase() || "";
          const legName = leg.arrivalAirport.name?.toLowerCase() || "";

          return (
            legIata === toCode ||
            legIcao === toCode ||
            legCity.includes(toCity || toCode.toLowerCase()) ||
            legCountry.includes(toCity || toCode.toLowerCase()) ||
            legName.includes(toCity || toCode.toLowerCase())
          );
        });
      }
    }

    // Combine results - always use AND logic
    // Radius only expands the geographic area for that field, but both conditions must be met
    if (fromQuery && toQuery) {
      // Both filters applied - use AND logic (departure matches AND arrival matches)
      const departureIds = new Set(
        departureFilteredLegs.map((leg: any) => leg.id),
      );
      const arrivalIds = new Set(arrivalFilteredLegs.map((leg: any) => leg.id));

      // AND logic: flight must match both departure AND arrival criteria
      transformedLegs = transformedLegs.filter(
        (leg: any) => departureIds.has(leg.id) && arrivalIds.has(leg.id),
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

    // Sorting - Prioritize admin-created deals first, then sort by selected criteria
    transformedLegs.sort((a: any, b: any) => {
      // First priority: Admin-created deals come before operator/instacharter deals
      const aIsAdmin = a.ownerType === "admin";
      const bIsAdmin = b.ownerType === "admin";

      if (aIsAdmin && !bIsAdmin) return -1; // a comes first
      if (!aIsAdmin && bIsAdmin) return 1; // b comes first

      // If both are same type (both admin or both non-admin), sort by selected criteria
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

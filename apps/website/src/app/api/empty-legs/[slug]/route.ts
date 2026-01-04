import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pexjet/database";

// Helper function to get airport by ICAO code with full database info
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
      return {
        id: airport.id,
        name: airport.name,
        city: airport.municipality || "",
        region: airport.region?.name || "",
        country: airport.country?.name || airport.countryCode || "",
        iataCode: airport.iataCode || "",
        icaoCode: airport.icaoCode || "",
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
    region: "",
    country: "",
    iataCode: "",
    icaoCode: icao,
    latitude: 0,
    longitude: 0,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } },
) {
  try {
    const { slug } = params;

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
            region: {
              select: {
                name: true,
              },
            },
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
            region: {
              select: {
                name: true,
              },
            },
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

    // Handle pricing based on priceType and priceUsd
    let displayPrice = null;
    let displayText = "";

    if (emptyLeg.priceType === "CONTACT") {
      displayText = "Contact for price";
    } else if (
      emptyLeg.priceType === "FIXED" &&
      emptyLeg.priceUsd &&
      emptyLeg.priceUsd > 0
    ) {
      displayPrice = emptyLeg.priceUsd;
      displayText = `$${emptyLeg.priceUsd.toLocaleString()}`;
    } else {
      displayText = "Contact for price";
    }

    // Transform the leg data, handling both admin-created and InstaCharter deals
    // Prioritize IATA codes and include region data
    let departureAirport;
    if (emptyLeg.departureAirport) {
      // Check if we need to lookup for IATA code
      if (
        !emptyLeg.departureAirport.iataCode &&
        emptyLeg.departureAirport.icaoCode
      ) {
        const fullAirportData = await getAirportByIcao(
          emptyLeg.departureAirport.icaoCode,
        );
        departureAirport = {
          id: emptyLeg.departureAirport.id,
          name: emptyLeg.departureAirport.name,
          city: emptyLeg.departureAirport.municipality || fullAirportData.city,
          region:
            emptyLeg.departureAirport.region?.name || fullAirportData.region,
          country:
            emptyLeg.departureAirport.country?.name || fullAirportData.country,
          iataCode: fullAirportData.iataCode || "",
          icaoCode: emptyLeg.departureAirport.icaoCode || "",
          latitude: emptyLeg.departureAirport.latitude,
          longitude: emptyLeg.departureAirport.longitude,
        };
      } else {
        departureAirport = {
          id: emptyLeg.departureAirport.id,
          name: emptyLeg.departureAirport.name,
          city: emptyLeg.departureAirport.municipality || "",
          region: emptyLeg.departureAirport.region?.name || "",
          country: emptyLeg.departureAirport.country?.name || "",
          iataCode: emptyLeg.departureAirport.iataCode || "",
          icaoCode: emptyLeg.departureAirport.icaoCode || "",
          latitude: emptyLeg.departureAirport.latitude,
          longitude: emptyLeg.departureAirport.longitude,
        };
      }
    } else {
      departureAirport = await getAirportByIcao(emptyLeg.departureIcao);
    }

    let arrivalAirport;
    if (emptyLeg.arrivalAirport) {
      // Check if we need to lookup for IATA code
      if (
        !emptyLeg.arrivalAirport.iataCode &&
        emptyLeg.arrivalAirport.icaoCode
      ) {
        const fullAirportData = await getAirportByIcao(
          emptyLeg.arrivalAirport.icaoCode,
        );
        arrivalAirport = {
          id: emptyLeg.arrivalAirport.id,
          name: emptyLeg.arrivalAirport.name,
          city: emptyLeg.arrivalAirport.municipality || fullAirportData.city,
          region:
            emptyLeg.arrivalAirport.region?.name || fullAirportData.region,
          country:
            emptyLeg.arrivalAirport.country?.name || fullAirportData.country,
          iataCode: fullAirportData.iataCode || "",
          icaoCode: emptyLeg.arrivalAirport.icaoCode || "",
          latitude: emptyLeg.arrivalAirport.latitude,
          longitude: emptyLeg.arrivalAirport.longitude,
        };
      } else {
        arrivalAirport = {
          id: emptyLeg.arrivalAirport.id,
          name: emptyLeg.arrivalAirport.name,
          city: emptyLeg.arrivalAirport.municipality || "",
          region: emptyLeg.arrivalAirport.region?.name || "",
          country: emptyLeg.arrivalAirport.country?.name || "",
          iataCode: emptyLeg.arrivalAirport.iataCode || "",
          icaoCode: emptyLeg.arrivalAirport.icaoCode || "",
          latitude: emptyLeg.arrivalAirport.latitude,
          longitude: emptyLeg.arrivalAirport.longitude,
        };
      }
    } else {
      arrivalAirport = await getAirportByIcao(emptyLeg.arrivalIcao);
    }

    const transformedLeg = {
      id: emptyLeg.id,
      slug: emptyLeg.slug,
      departureAirport,
      arrivalAirport,
      aircraft: emptyLeg.aircraft
        ? {
            id: emptyLeg.aircraft.id,
            name: emptyLeg.aircraft.name,
            manufacturer: emptyLeg.aircraft.manufacturer,
            model: emptyLeg.aircraftType || "",
            category: emptyLeg.aircraftCategory || emptyLeg.aircraft.category,
            maxPassengers: emptyLeg.aircraft.maxPax || 0,
            images: emptyLeg.aircraftImage
              ? [emptyLeg.aircraftImage]
              : emptyLeg.aircraft.image
                ? [emptyLeg.aircraft.image]
                : [],
          }
        : {
            // Handle InstaCharter deals - use stored fields
            id: "",
            name: emptyLeg.aircraftName || "",
            manufacturer: "",
            model: emptyLeg.aircraftType || "",
            category: emptyLeg.aircraftCategory || "",
            maxPassengers: emptyLeg.totalSeats || 0,
            images: emptyLeg.aircraftImage ? [emptyLeg.aircraftImage] : [],
          },
      departureDate: emptyLeg.departureDateTime.toISOString(),
      availableSeats: emptyLeg.availableSeats,
      totalSeats: emptyLeg.totalSeats,
      // Pricing - simplified based on schema
      priceUsd: displayPrice,
      priceText: displayText,
      priceType: emptyLeg.priceType,
      ownerType: emptyLeg.createdByOperatorId ? "operator" : "admin",
      createdByAdminId: emptyLeg.createdByAdminId,
      createdByOperatorId: emptyLeg.createdByOperatorId,
      // Add InstaCharter operator information if available
      operatorName: emptyLeg.operatorName,
      operatorEmail: emptyLeg.operatorEmail,
      operatorPhone: emptyLeg.operatorPhone,
      operatorWebsite: emptyLeg.operatorWebsite,
      operatorRating: emptyLeg.operatorRating,
      source: emptyLeg.source, // Add source to distinguish InstaCharter deals
    };

    return NextResponse.json({
      emptyLeg: transformedLeg,
    });
  } catch (error: any) {
    console.error("Empty leg fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch empty leg" },
      { status: 500 },
    );
  }
}

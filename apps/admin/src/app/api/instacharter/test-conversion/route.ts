/**
 * Test endpoint to verify InstaCharter deal conversion
 * Fetches one deal from InstaCharter API and shows how it would be converted
 * with airport lookup (ICAO/GPS code → IATA code + city/country)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pexjet/database";
import { getAvailabilities, mapAvailabilityToEmptyLeg } from "@pexjet/lib";

/**
 * Find airport by ICAO code (searches both icaoCode and gpsCode fields)
 */
async function findAirportByIcao(icaoCode: string | null | undefined) {
  if (!icaoCode) return null;

  const code = icaoCode.toUpperCase();

  const airport = await prisma.airport.findFirst({
    where: {
      OR: [{ icaoCode: code }, { gpsCode: code }],
    },
    select: {
      id: true,
      iataCode: true,
      icaoCode: true,
      gpsCode: true,
      localCode: true,
      municipality: true,
      name: true,
      latitude: true,
      longitude: true,
      country: {
        select: { name: true, code: true },
      },
      region: {
        select: { name: true },
      },
    },
  });

  return airport;
}

export async function GET(request: NextRequest) {
  try {
    // 1. Fetch one page of deals from InstaCharter API
    console.log("[Test Conversion] Fetching deals from InstaCharter API...");
    const response = await getAvailabilities(1);

    if (!response.success || !response.data || response.data.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No deals found from InstaCharter API",
          apiResponse: response,
        },
        { status: 404 },
      );
    }

    // 2. Take the first deal
    const apiDeal = response.data[0];
    console.log("[Test Conversion] Processing deal:", apiDeal.id);

    // 3. Map to our format
    const mappedData = mapAvailabilityToEmptyLeg(apiDeal);

    // 4. Look up airports in our database
    const departureAirport = await findAirportByIcao(mappedData.departureIcao);
    const arrivalAirport = await findAirportByIcao(mappedData.arrivalIcao);

    // 5. Generate city-based slug
    const departureCity =
      departureAirport?.municipality || mappedData.departureCity || "unknown";
    const arrivalCity =
      arrivalAirport?.municipality || mappedData.arrivalCity || "unknown";
    const dateStr = mappedData.departureDateTime.toISOString().split("T")[0];
    const slug =
      `${departureCity}-to-${arrivalCity}-${dateStr}-ic-${mappedData.externalId}`
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-");

    // 6. Prepare enriched data
    const enrichedData = {
      ...mappedData,
      departureCity: departureAirport?.municipality || mappedData.departureCity,
      departureCountry:
        departureAirport?.country?.name || mappedData.departureCountry,
      arrivalCity: arrivalAirport?.municipality || mappedData.arrivalCity,
      arrivalCountry:
        arrivalAirport?.country?.name || mappedData.arrivalCountry,
      departureAirportId: departureAirport?.id || null,
      arrivalAirportId: arrivalAirport?.id || null,
      slug,
    };

    // 7. Return detailed conversion result
    return NextResponse.json({
      success: true,
      message: "Deal conversion test completed",
      rawApiDeal: {
        id: apiDeal.id,
        from: {
          icao: apiDeal.from.fromIcao,
          city: apiDeal.from.fromCity,
          date: apiDeal.from.dateFrom,
        },
        to: {
          icao: apiDeal.to.toIcao,
          city: apiDeal.to.toCity,
        },
        aircraft: {
          type: apiDeal.aircraft.aircraft_Type,
          category: apiDeal.aircraft.aircraft_Category,
          seats: apiDeal.aircraft.seats,
          price: apiDeal.aircraft.price,
        },
        operator: apiDeal.companyDetails.companyName,
      },
      airportLookup: {
        departure: {
          searchedCode: mappedData.departureIcao,
          found: !!departureAirport,
          matchedField: departureAirport
            ? departureAirport.icaoCode ===
              mappedData.departureIcao.toUpperCase()
              ? "icaoCode"
              : "gpsCode"
            : null,
          airport: departureAirport
            ? {
                id: departureAirport.id,
                iataCode: departureAirport.iataCode,
                icaoCode: departureAirport.icaoCode,
                gpsCode: departureAirport.gpsCode,
                name: departureAirport.name,
                city: departureAirport.municipality,
                country: departureAirport.country?.name,
                region: departureAirport.region?.name,
              }
            : null,
        },
        arrival: {
          searchedCode: mappedData.arrivalIcao,
          found: !!arrivalAirport,
          matchedField: arrivalAirport
            ? arrivalAirport.icaoCode === mappedData.arrivalIcao.toUpperCase()
              ? "icaoCode"
              : "gpsCode"
            : null,
          airport: arrivalAirport
            ? {
                id: arrivalAirport.id,
                iataCode: arrivalAirport.iataCode,
                icaoCode: arrivalAirport.icaoCode,
                gpsCode: arrivalAirport.gpsCode,
                name: arrivalAirport.name,
                city: arrivalAirport.municipality,
                country: arrivalAirport.country?.name,
                region: arrivalAirport.region?.name,
              }
            : null,
        },
      },
      convertedDeal: {
        slug: enrichedData.slug,
        displayRoute: `${enrichedData.departureCity} → ${enrichedData.arrivalCity}`,
        departureIcao: enrichedData.departureIcao,
        departureCity: enrichedData.departureCity,
        departureCountry: enrichedData.departureCountry,
        arrivalIcao: enrichedData.arrivalIcao,
        arrivalCity: enrichedData.arrivalCity,
        arrivalCountry: enrichedData.arrivalCountry,
        departureDateTime: enrichedData.departureDateTime,
        aircraftType: enrichedData.aircraftType,
        aircraftCategory: enrichedData.aircraftCategory,
        totalSeats: enrichedData.totalSeats,
        priceType: enrichedData.priceType,
        priceUsd: enrichedData.priceUsd,
        operatorName: enrichedData.operatorName,
        linkedToDatabase: {
          departureAirportId: enrichedData.departureAirportId,
          arrivalAirportId: enrichedData.arrivalAirportId,
        },
      },
    });
  } catch (error) {
    console.error("[Test Conversion] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

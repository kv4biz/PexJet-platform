import { NextRequest, NextResponse } from "next/server";

/**
 * Charter Options API
 * Calls InstaCharter GetOptions endpoint to get aircraft categories, pricing, and jets
 *
 * Expected request body:
 * {
 *   from: { lat: number, long: number, name: string },
 *   to: { lat: number, long: number, name: string },
 *   date: string (YYYY-MM-DD),
 *   pax: number
 * }
 *
 * Response format:
 * {
 *   categories: [
 *     {
 *       category: "Light",
 *       price: 26000,
 *       priceFormatted: "$26,000",
 *       maxPassengers: 6,
 *       flightTime: "2h 30m",
 *       jets: [
 *         { name: "Premier 1A", image: "url" },
 *         { name: "Embraer Phenom 100", image: "url" }
 *       ]
 *     }
 *   ],
 *   emptyLegs: [...] // Matching empty legs if any
 * }
 */

const INSTACHARTER_BASE_URL = "https://server.instacharter.app/api/Markets";

interface InstaCharterAircraftDetail {
  aircraftId: number;
  aircraftName: string;
  image: string;
  price_cat: string;
  search_cat: string;
}

interface InstaCharterBaseCategory {
  categoryId: number;
  aircraftCategory: string;
  distanceFromStart: number;
  distanceFromEnd: number;
  currency: string;
  currencySymbol: string;
  price: number;
  range: number;
  maxPax: number;
  totalFlightTime: string;
  aircraftDetails: InstaCharterAircraftDetail[];
}

interface InstaCharterHave {
  id: number;
  from: {
    dateFrom: string;
    fromIcao: string;
    fromCity: string;
    lat: number;
    long: number;
  };
  to: {
    dateTo: string;
    toIcao: string;
    toCity: string;
    lat: number;
    long: number;
  };
  aircraft: {
    acCat: string;
    acType: string;
    availType: string;
    seats: number;
    price: string;
  };
  companyDetails: {
    companyId: number;
    company: string;
    contactEmail: string;
    phone: string;
  };
  aircraftImage: string;
  startDist: number;
  endDist: number;
}

interface InstaCharterResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    base: InstaCharterBaseCategory[];
    haves: InstaCharterHave[];
    tails?: any[];
    emptyLegs?: any[];
    fleet?: any[];
  };
}

// Transform category name to match our UI
function normalizeCategory(category: string): string {
  const lower = category.toLowerCase();
  if (lower.includes("light")) return "Light";
  if (lower.includes("super") && lower.includes("mid")) return "Super Midsize";
  if (lower.includes("mid")) return "Midsize";
  if (lower.includes("ultra") || lower.includes("long range"))
    return "Ultra Long Range";
  if (lower.includes("heavy")) return "Heavy";
  if (lower.includes("propeller") || lower.includes("turbo"))
    return "Turboprop";
  if (lower.includes("helicopter")) return "Helicopter";
  if (lower.includes("airliner")) return "Airliner";
  return category;
}

// Format price with currency symbol
function formatPrice(price: number, currencySymbol: string = "$"): string {
  return `${currencySymbol}${price.toLocaleString()}`;
}

// Format flight time from "H:MM" to "X hrs YY min"
function formatFlightTime(
  time: string,
  multiplier: number = 1,
): { raw: string; formatted: string } {
  if (!time) return { raw: "N/A", formatted: "N/A" };

  const parts = time.split(":");
  if (parts.length !== 2) return { raw: time, formatted: time };

  let hours = parseInt(parts[0], 10) || 0;
  let minutes = parseInt(parts[1], 10) || 0;

  // Apply multiplier for round trip / multi-leg
  const totalMinutes = (hours * 60 + minutes) * multiplier;
  hours = Math.floor(totalMinutes / 60);
  minutes = Math.round(totalMinutes % 60);

  const raw = `${hours}:${minutes.toString().padStart(2, "0")}`;
  const formatted = `${hours} hrs ${minutes.toString().padStart(2, "0")} min`;

  return { raw, formatted };
}

// Apply 5% markup to price
function applyMarkup(price: number, markupPercent: number = 5): number {
  return Math.round(price * (1 + markupPercent / 100));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { from, to, date, pax, tripType, flights } = body;

    // Calculate flight time multiplier based on trip type
    let flightTimeMultiplier = 1;
    if (tripType === "roundTrip") {
      flightTimeMultiplier = 2;
    } else if (tripType === "multiLeg" && flights && flights.length > 1) {
      flightTimeMultiplier = flights.length;
    }

    // Validate required fields
    if (!from?.lat || !from?.long || !from?.name) {
      return NextResponse.json(
        {
          error: "Missing departure location (from.lat, from.long, from.name)",
        },
        { status: 400 },
      );
    }

    if (!to?.lat || !to?.long || !to?.name) {
      return NextResponse.json(
        { error: "Missing arrival location (to.lat, to.long, to.name)" },
        { status: 400 },
      );
    }

    if (!date) {
      return NextResponse.json({ error: "Missing date" }, { status: 400 });
    }

    const apiKey = process.env.INSTACHARTER_API_KEY;
    const clientId = process.env.INSTACHARTER_CLIENT_ID || apiKey;

    if (!apiKey) {
      return NextResponse.json(
        { error: "InstaCharter API not configured" },
        { status: 500 },
      );
    }

    // Call InstaCharter GetOptions API
    const instaCharterResponse = await fetch(
      `${INSTACHARTER_BASE_URL}/GetOptions`,
      {
        method: "POST",
        headers: {
          accept: "*/*",
          "X-Api-Key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currency: "USD",
          clientId: clientId,
          itinerary: [
            {
              from: {
                lat: from.lat,
                long: from.long,
                name: from.name,
              },
              to: {
                lat: to.lat,
                long: to.long,
                name: to.name,
              },
              date: date,
              pax: pax || 1,
            },
          ],
        }),
      },
    );

    if (!instaCharterResponse.ok) {
      const errorText = await instaCharterResponse.text();
      console.error("[Charter Options] InstaCharter API error:", errorText);
      return NextResponse.json(
        { error: "Failed to fetch charter options from InstaCharter" },
        { status: 502 },
      );
    }

    const data: InstaCharterResponse = await instaCharterResponse.json();

    if (!data.success) {
      console.error(
        "[Charter Options] InstaCharter returned error:",
        data.message,
      );
      return NextResponse.json(
        { error: data.message || "InstaCharter API error" },
        { status: 502 },
      );
    }

    // Transform the response to our format
    const categories = (data.data?.base || []).map((cat) => {
      // Apply 5% markup to price
      const markedUpPrice = applyMarkup(cat.price);
      // Format flight time with multiplier for round trip / multi-leg
      const formattedTime = formatFlightTime(
        cat.totalFlightTime,
        flightTimeMultiplier,
      );

      return {
        categoryId: cat.categoryId,
        category: normalizeCategory(cat.aircraftCategory),
        originalCategory: cat.aircraftCategory,
        price: markedUpPrice,
        priceFormatted: formatPrice(markedUpPrice, cat.currencySymbol),
        currency: cat.currency,
        currencySymbol: cat.currencySymbol,
        maxPassengers: cat.maxPax,
        range: cat.range,
        flightTime: formattedTime.raw,
        flightTimeFormatted: formattedTime.formatted,
        distanceFromStart: cat.distanceFromStart,
        distanceFromEnd: cat.distanceFromEnd,
        jets: (cat.aircraftDetails || []).map((jet) => ({
          id: jet.aircraftId,
          name: jet.aircraftName,
          image: jet.image || "",
          priceCategory: jet.price_cat,
          searchCategory: jet.search_cat,
        })),
      };
    });

    // Transform matching empty legs (haves)
    const emptyLegs = (data.data?.haves || []).map((have) => ({
      id: have.id,
      from: {
        date: have.from.dateFrom,
        icao: have.from.fromIcao,
        city: have.from.fromCity,
        lat: have.from.lat,
        long: have.from.long,
      },
      to: {
        date: have.to.dateTo,
        icao: have.to.toIcao,
        city: have.to.toCity,
        lat: have.to.lat,
        long: have.to.long,
      },
      aircraft: {
        category: have.aircraft.acCat,
        type: have.aircraft.acType,
        availabilityType: have.aircraft.availType,
        seats: have.aircraft.seats,
        price: have.aircraft.price,
        image: have.aircraftImage || "",
      },
      operator: {
        id: have.companyDetails.companyId,
        name: have.companyDetails.company,
        email: have.companyDetails.contactEmail,
        phone: have.companyDetails.phone,
      },
      distanceFromStart: have.startDist,
      distanceFromEnd: have.endDist,
    }));

    return NextResponse.json({
      success: true,
      categories,
      emptyLegs,
      totalCategories: categories.length,
      totalEmptyLegs: emptyLegs.length,
    });
  } catch (error: any) {
    console.error("[Charter Options] Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

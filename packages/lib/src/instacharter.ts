/**
 * InstaCharter API Service
 * Handles communication with InstaCharter API for empty leg deals
 * API Documentation: https://server.instacharter.app/api/Markets
 */

import {
  GetAvailabilitiesResponse,
  InstaCharterAvailability,
  InstaCharterConfig,
  MappedEmptyLegData,
} from "./instacharter-types";

// =============================================================================
// InstaCharter Integration
// =============================================================================

// Global cache for aircraft images to avoid repeated API calls
const aircraftImageCache = new Map<string, string>();

// =============================================================================
// Configuration
// =============================================================================

const DEFAULT_BASE_URL = "https://server.instacharter.app/api/Markets";

function getConfig(): InstaCharterConfig {
  const clientId = process.env.INSTACHARTER_CLIENT_ID || "";
  const apiKey = process.env.INSTACHARTER_API_KEY;
  const baseUrl = process.env.INSTACHARTER_BASE_URL || DEFAULT_BASE_URL;

  if (!apiKey) {
    throw new Error(
      "InstaCharter API credentials not configured. Set INSTACHARTER_API_KEY environment variable.",
    );
  }

  return { clientId, apiKey, baseUrl };
}

// =============================================================================
// API Functions
// =============================================================================

/**
 * Fetch available empty leg deals from InstaCharter API
 * Uses GET /api/Markets/GetAvailabilities?PageNo=X
 * Returns 20 latest availabilities per page
 */
export async function getAvailabilities(
  pageNo: number = 1,
): Promise<GetAvailabilitiesResponse> {
  const config = getConfig();

  try {
    const url = `${config.baseUrl}/GetAvailabilities?PageNo=${pageNo}`;
    console.log("[InstaCharter] Fetching availabilities from:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "text/plain",
        "X-Api-Key": config.apiKey,
      },
    });

    console.log("[InstaCharter] Response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[InstaCharter] API error response:", errorText);
      throw new Error(
        `InstaCharter API error: ${response.status} - ${errorText}`,
      );
    }

    const data: GetAvailabilitiesResponse = await response.json();
    console.log(
      "[InstaCharter] Received",
      data.data?.length || 0,
      "availabilities",
    );

    return data;
  } catch (error: any) {
    console.error("[InstaCharter] getAvailabilities error:", error);

    let errorMessage = "Unknown error";
    if (error instanceof Error) {
      if (
        error.message.includes("fetch failed") ||
        error.message.includes("ENOTFOUND")
      ) {
        errorMessage = `Network error connecting to InstaCharter API. Details: ${error.message}`;
      } else {
        errorMessage = error.message;
      }
    }

    if (error?.cause) {
      console.error("[InstaCharter] Error cause:", error.cause);
    }

    return {
      success: false,
      statusCode: 500,
      message: errorMessage,
      data: [],
    };
  }
}

/**
 * Fetch all available empty leg deals by paginating through all pages
 * Includes aircraft image fetching for each deal
 */
export async function getAllAvailabilities(): Promise<
  InstaCharterAvailability[]
> {
  const allDeals: InstaCharterAvailability[] = [];
  let pageNo = 1;
  const maxPages = 10; // Safety limit

  while (pageNo <= maxPages) {
    const response = await getAvailabilities(pageNo);

    if (!response.success || !response.data || response.data.length === 0) {
      break;
    }

    // Filter for one-way trips only
    const oneWayDeals = response.data.filter(
      (deal) => deal.aircraft.availabilityType === "One Way",
    );

    // Fetch aircraft images for each one-way deal
    const dealsWithImages = await Promise.all(
      oneWayDeals.map(async (deal) => {
        const image = await fetchAircraftImage(deal);
        return { ...deal, aircraftImage: image || undefined };
      }),
    );

    allDeals.push(...dealsWithImages);

    // If we got fewer than 20 results, we've reached the last page
    if (response.data.length < 20) {
      break;
    }

    pageNo++;
  }

  console.log(
    `[InstaCharter] Fetched ${allDeals.length} one-way deals with images`,
  );
  return allDeals;
}

/**
 * Fetch aircraft image using GetOptions API
 */
async function fetchAircraftImage(
  deal: InstaCharterAvailability,
): Promise<string | null> {
  const config = getConfig();
  if (!config.apiKey) {
    console.warn("[InstaCharter] No API key configured, skipping image fetch");
    return null;
  }

  const aircraftType = deal.aircraft.aircraft_Type;

  // Check cache first
  if (aircraftImageCache.has(aircraftType)) {
    return aircraftImageCache.get(aircraftType)!;
  }

  try {
    const response = await fetch(`${config.baseUrl}/GetOptions`, {
      method: "POST",
      headers: {
        accept: "application/json",
        "X-Api-Key": config.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        currency: "USD",
        clientId: config.apiKey,
        itinerary: [
          {
            from: {
              lat: deal.from.lat || 0,
              long: deal.from.long || 0,
              name: deal.from.fromCity || "Origin",
            },
            to: {
              lat: deal.to.lat || 0,
              long: deal.to.long || 0,
              name: deal.to.toCity || "Destination",
            },
            date:
              deal.from.dateFrom?.split("T")[0] ||
              new Date().toISOString().split("T")[0],
            pax: deal.aircraft.seats || 4,
          },
        ],
      }),
    });

    if (!response.ok) {
      console.warn(
        `[InstaCharter] Failed to fetch aircraft image for ${aircraftType}: ${response.status}`,
      );
      return null;
    }

    const data = await response.json();

    if (data.success && data.data?.base) {
      // Find matching aircraft image
      let imageUrl = null;

      for (const category of data.data.base) {
        if (category.aircraftDetails) {
          // Try exact match first
          const exactMatch = category.aircraftDetails.find(
            (a: any) =>
              a.aircraftName?.toLowerCase() === aircraftType?.toLowerCase(),
          );

          if (exactMatch?.image) {
            imageUrl = exactMatch.image;
            break;
          }

          // Try partial match
          const partialMatch = category.aircraftDetails.find((a: any) =>
            aircraftType
              ?.toLowerCase()
              .includes(a.aircraftName?.toLowerCase().split(" ")[0]),
          );

          if (partialMatch?.image) {
            imageUrl = partialMatch.image;
            break;
          }

          // Use category match
          if (
            category.aircraftCategory?.toLowerCase() ===
            deal.aircraft.aircraft_Category?.toLowerCase()
          ) {
            imageUrl = category.aircraftDetails[0]?.image;
            break;
          }
        }
      }

      // Fallback to first available image
      if (!imageUrl && data.data.base[0]?.aircraftDetails?.[0]?.image) {
        imageUrl = data.data.base[0].aircraftDetails[0].image;
      }

      if (imageUrl) {
        aircraftImageCache.set(aircraftType, imageUrl);
        console.log(
          `[InstaCharter] Found image for ${aircraftType}: ${imageUrl}`,
        );
        return imageUrl;
      }
    }
  } catch (error) {
    console.warn(
      `[InstaCharter] Error fetching aircraft image for ${aircraftType}:`,
      error,
    );
  }

  return null;
}

// =============================================================================
// Data Mapping Functions
// =============================================================================

/**
 * Parse price string like "$26K" or "230000" to number
 */
function parsePrice(priceStr: string): number | null {
  if (!priceStr) return null;

  // Remove currency symbols and whitespace
  let cleaned = priceStr.replace(/[$€£,\s]/g, "").trim();

  // Handle K suffix (thousands)
  if (cleaned.toUpperCase().endsWith("K")) {
    const num = parseFloat(cleaned.slice(0, -1));
    return isNaN(num) ? null : num * 1000;
  }

  // Handle M suffix (millions)
  if (cleaned.toUpperCase().endsWith("M")) {
    const num = parseFloat(cleaned.slice(0, -1));
    return isNaN(num) ? null : num * 1000000;
  }

  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

/**
 * Parse a local time string and return a Date object that preserves the local time.
 * The date string from InstaCharter is like "2025-06-14T10:00:00" (local time at departure).
 * We store it as-is by treating it as UTC, so no timezone conversion happens.
 */
function parseLocalTimeAsUTC(dateString: string): Date {
  // Extract date and time components directly from the string
  const match = dateString.match(
    /(\d{4})-(\d{2})-(\d{2})T?(\d{2})?:?(\d{2})?:?(\d{2})?/,
  );
  if (!match) {
    // Fallback: return current date if parsing fails
    return new Date();
  }

  const [, year, month, day, hours = "00", minutes = "00", seconds = "00"] =
    match;

  // Create a UTC date with these exact values (no timezone conversion)
  return new Date(
    Date.UTC(
      parseInt(year),
      parseInt(month) - 1, // Month is 0-indexed
      parseInt(day),
      parseInt(hours),
      parseInt(minutes),
      parseInt(seconds),
    ),
  );
}

/**
 * Generate a unique slug for an InstaCharter deal
 */
function generateSlug(deal: InstaCharterAvailability): string {
  // Extract date directly from string without timezone conversion
  const dateStr = deal.from.dateFrom.split("T")[0];
  const slug =
    `${deal.from.fromIcao}-to-${deal.to.toIcao}-${dateStr}-ic-${deal.id}`
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-");
  return slug;
}

/**
 * Map aircraft category string to our enum
 */
function mapAircraftCategory(category: string): string | null {
  const categoryLower = category?.toLowerCase() || "";
  if (categoryLower.includes("light")) return "LIGHT_JET";
  if (categoryLower.includes("super") && categoryLower.includes("mid"))
    return "SUPER_MIDSIZE_JET";
  if (categoryLower.includes("mid")) return "MIDSIZE_JET";
  if (
    categoryLower.includes("heavy") ||
    categoryLower.includes("long") ||
    categoryLower.includes("ultra")
  )
    return "ULTRA_LONG_RANGE";
  if (categoryLower.includes("propeller") || categoryLower.includes("turbo"))
    return "TURBOPROP";
  if (categoryLower.includes("helicopter")) return "HELICOPTER";
  return null;
}

/**
 * Map InstaCharter availability to our EmptyLeg database format
 */
export function mapAvailabilityToEmptyLeg(
  deal: InstaCharterAvailability,
): MappedEmptyLegData {
  // Parse the local time string and store as UTC to preserve the exact time
  const departureDate = parseLocalTimeAsUTC(deal.from.dateFrom);
  const price = parsePrice(deal.aircraft.price);

  return {
    externalId: deal.id.toString(),
    slug: generateSlug(deal),
    source: "INSTACHARTER",
    departureIcao: deal.from.fromIcao,
    departureCity: deal.from.fromCity,
    departureCountry: null, // Not provided in API
    arrivalIcao: deal.to.toIcao,
    arrivalCity: deal.to.toCity,
    arrivalCountry: null, // Not provided in API
    departureDateTime: departureDate,
    aircraftName: deal.aircraft.aircraft_Type,
    aircraftType: deal.aircraft.aircraft_Type,
    aircraftCategory: mapAircraftCategory(deal.aircraft.aircraft_Category),
    aircraftImage: deal.aircraftImage || null,
    totalSeats: deal.aircraft.seats,
    availableSeats: deal.aircraft.seats, // API doesn't provide available, assume all
    priceType: price != null ? "FIXED" : "CONTACT",
    priceUsd: price,
    operatorName: deal.companyDetails.companyName,
    operatorEmail: deal.companyDetails.email || null,
    operatorPhone: deal.companyDetails.phone || null,
    status: "PUBLISHED",
    lastSyncedAt: new Date(),
  };
}

// =============================================================================
// API Health Check
// =============================================================================

/**
 * Check if InstaCharter API is configured and accessible
 */
export async function checkApiHealth(): Promise<{
  configured: boolean;
  accessible: boolean;
  message: string;
}> {
  try {
    const config = getConfig();

    const response = await fetch(
      `${config.baseUrl}/GetAvailabilities?PageNo=1`,
      {
        method: "GET",
        headers: {
          Accept: "text/plain",
          "X-Api-Key": config.apiKey,
        },
      },
    );

    if (response.ok) {
      return {
        configured: true,
        accessible: true,
        message: "InstaCharter API is configured and accessible",
      };
    } else {
      const errorText = await response.text();
      return {
        configured: true,
        accessible: false,
        message: `InstaCharter API returned status ${response.status}: ${errorText}`,
      };
    }
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("credentials not configured")
    ) {
      return {
        configured: false,
        accessible: false,
        message: error.message,
      };
    }
    return {
      configured: true,
      accessible: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// =============================================================================
// Export Types
// =============================================================================

export type {
  GetAvailabilitiesResponse,
  InstaCharterAvailability,
  InstaCharterConfig,
  MappedEmptyLegData,
  SyncResult,
} from "./instacharter-types";

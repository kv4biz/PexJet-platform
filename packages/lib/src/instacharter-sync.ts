/**
 * InstaCharter Sync Service
 * Handles syncing empty leg deals from InstaCharter to PexJet database
 * Designed to run daily at midnight via cron job
 */

import { PrismaClient } from "@prisma/client";
import {
  getAllAvailabilities,
  mapAvailabilityToEmptyLeg,
  InstaCharterAvailability,
} from "./instacharter";
import { SyncResult } from "./instacharter-types";

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Airport data returned from lookup
 */
interface AirportLookupResult {
  id: string;
  iataCode: string | null;
  icaoCode: string | null;
  name: string | null;
  city: string | null;
  country: string | null;
  region: string | null;
  latitude: number;
  longitude: number;
}

/**
 * Find airport by code with fallback strategy: ICAO → GPS code → local code
 * Returns full airport data from OUR database for populating EmptyLeg fields
 */
async function findAirportByCode(
  prisma: PrismaClient,
  icaoCode: string | null | undefined,
): Promise<AirportLookupResult | null> {
  if (!icaoCode) return null;

  const code = icaoCode.toUpperCase().trim();

  try {
    // Strategy: Try ICAO code → GPS code → local code (ident field)
    const airport = await prisma.airport.findFirst({
      where: {
        OR: [
          { icaoCode: code },
          { gpsCode: code },
          { ident: code },
          { localCode: code },
        ],
      },
      select: {
        id: true,
        name: true,
        iataCode: true,
        icaoCode: true,
        municipality: true,
        latitude: true,
        longitude: true,
        country: {
          select: { name: true },
        },
        region: {
          select: { name: true },
        },
      },
    });

    if (!airport) {
      console.log(
        `[InstaCharter Sync] No airport found for code: ${code} (tried ICAO, GPS, ident, local)`,
      );
      return null;
    }

    // Validate we have the essential data from our database
    if (!airport.iataCode && !airport.icaoCode) {
      console.log(
        `[InstaCharter Sync] Airport found but missing IATA/ICAO code: ${code}`,
      );
      return null;
    }

    console.log(
      `[InstaCharter Sync] Found airport: ${airport.iataCode || airport.icaoCode} - ${airport.name} (${airport.municipality}, ${airport.country?.name}) for code ${code}`,
    );

    return {
      id: airport.id,
      iataCode: airport.iataCode,
      icaoCode: airport.icaoCode,
      name: airport.name,
      city: airport.municipality,
      country: airport.country?.name || null,
      region: airport.region?.name || null,
      latitude: airport.latitude,
      longitude: airport.longitude,
    };
  } catch (error) {
    console.error(
      `[InstaCharter Sync] Error finding airport for code ${code}:`,
      error,
    );
    return null;
  }
}

/**
 * Validate that a deal has all required fields for display
 */
function validateDealCompleteness(
  deal: InstaCharterAvailability,
  departureAirport: AirportLookupResult | null,
  arrivalAirport: AirportLookupResult | null,
  aircraftImage: string | null,
): { valid: boolean; missingFields: string[] } {
  const missingFields: string[] = [];

  // Check departure airport (from our DB)
  if (!departureAirport) {
    missingFields.push("departure airport (not in our database)");
  } else {
    if (!departureAirport.iataCode && !departureAirport.icaoCode) {
      missingFields.push("departure IATA/ICAO code");
    }
    if (!departureAirport.city) {
      missingFields.push("departure city");
    }
    if (!departureAirport.country) {
      missingFields.push("departure country");
    }
  }

  // Check arrival airport (from our DB)
  if (!arrivalAirport) {
    missingFields.push("arrival airport (not in our database)");
  } else {
    if (!arrivalAirport.iataCode && !arrivalAirport.icaoCode) {
      missingFields.push("arrival IATA/ICAO code");
    }
    if (!arrivalAirport.city) {
      missingFields.push("arrival city");
    }
    if (!arrivalAirport.country) {
      missingFields.push("arrival country");
    }
  }

  // Check date/time
  if (!deal.from.dateFrom) {
    missingFields.push("departure date/time");
  }

  // Check seats
  if (!deal.aircraft.seats || deal.aircraft.seats <= 0) {
    missingFields.push("seats");
  }

  // Check aircraft name
  if (!deal.aircraft.aircraft_Type) {
    missingFields.push("aircraft name");
  }

  // Check aircraft category
  if (!deal.aircraft.aircraft_Category) {
    missingFields.push("aircraft category");
  }

  // Check aircraft image
  if (!aircraftImage) {
    missingFields.push("aircraft image");
  }

  return {
    valid: missingFields.length === 0,
    missingFields,
  };
}

// =============================================================================
// Sync Service
// =============================================================================

/**
 * Sync InstaCharter empty leg deals to database
 * - Fetches all one-way deals within 6 months from InstaCharter API
 * - Creates new deals that don't exist in our database
 * - Updates existing deals with latest info
 * - Deletes deals that are no longer in InstaCharter API
 * - Links ICAO codes to airport records for IATA codes and coordinates
 */
export async function syncInstaCharterDeals(
  prisma: PrismaClient,
  options?: {
    syncType?: "SCHEDULED" | "MANUAL";
    triggeredById?: string;
  },
): Promise<SyncResult> {
  const startTime = Date.now();
  const syncType = options?.syncType || "SCHEDULED";
  const triggeredById = options?.triggeredById;

  const result: SyncResult = {
    success: false,
    dealsFound: 0,
    dealsCreated: 0,
    dealsUpdated: 0,
    dealsRemoved: 0,
    errors: [],
    duration: 0,
  };

  // Create sync log entry
  const syncLog = await prisma.instaCharterSyncLog.create({
    data: {
      syncType,
      status: "STARTED",
      triggeredById,
      startedAt: new Date(),
    },
  });

  try {
    // 1. Fetch deals from InstaCharter API (paginated)
    console.log("[InstaCharter Sync] Fetching deals from API...");
    const apiDeals = await getAllAvailabilities();

    if (apiDeals.length === 0) {
      console.log("[InstaCharter Sync] No deals found from API");
    }

    result.dealsFound = apiDeals.length;
    console.log(
      `[InstaCharter Sync] Found ${result.dealsFound} deals from API`,
    );

    // 2. Get existing InstaCharter deals from our database
    const existingDeals = await prisma.emptyLeg.findMany({
      where: { source: "INSTACHARTER" },
      select: { id: true, externalId: true, status: true },
    });

    const existingDealMap = new Map(
      existingDeals.map((d) => [d.externalId, d]),
    );
    const apiDealIds = new Set(apiDeals.map((d) => d.id.toString()));

    // Track skipped deals for reporting
    let dealsSkipped = 0;

    // 3. Process each deal from API
    for (const apiDeal of apiDeals) {
      try {
        const mappedData = mapAvailabilityToEmptyLeg(apiDeal);
        const externalId = apiDeal.id.toString();
        const existingDeal = existingDealMap.get(externalId);

        // Look up airports from OUR database (ICAO → GPS → local code fallback)
        const departureAirport = await findAirportByCode(
          prisma,
          mappedData.departureIcao,
        );
        const arrivalAirport = await findAirportByCode(
          prisma,
          mappedData.arrivalIcao,
        );

        // Validate deal has ALL required fields
        const validation = validateDealCompleteness(
          apiDeal,
          departureAirport,
          arrivalAirport,
          mappedData.aircraftImage,
        );

        if (!validation.valid) {
          // Skip this deal - missing required fields
          console.log(
            `[InstaCharter Sync] SKIPPING deal ${externalId} - missing: ${validation.missingFields.join(", ")}`,
          );
          dealsSkipped++;

          // If this deal exists in our DB, delete it (no longer valid)
          if (existingDeal) {
            await prisma.emptyLeg.delete({ where: { id: existingDeal.id } });
            result.dealsRemoved++;
            console.log(
              `[InstaCharter Sync] Deleted existing incomplete deal ${externalId}`,
            );
          }
          continue;
        }

        // Generate slug using city names from OUR database
        const departureCity = departureAirport!.city || "unknown";
        const arrivalCity = arrivalAirport!.city || "unknown";
        const dateStr = mappedData.departureDateTime
          .toISOString()
          .split("T")[0];
        const baseSlug =
          `${departureCity}-to-${arrivalCity}-${dateStr}-ic-${mappedData.externalId}`
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, "-")
            .replace(/-+/g, "-");

        // Prepare data with ALL fields from OUR database
        const enrichedData = {
          ...mappedData,
          // Use IATA code preferentially, fallback to ICAO
          departureIata: departureAirport!.iataCode,
          departureIcao: departureAirport!.icaoCode || mappedData.departureIcao,
          departureCity: departureAirport!.city,
          departureCountry: departureAirport!.country,
          arrivalIata: arrivalAirport!.iataCode,
          arrivalIcao: arrivalAirport!.icaoCode || mappedData.arrivalIcao,
          arrivalCity: arrivalAirport!.city,
          arrivalCountry: arrivalAirport!.country,
          // Link to airport records
          departureAirportId: departureAirport!.id,
          arrivalAirportId: arrivalAirport!.id,
        };

        if (existingDeal) {
          // Update existing deal
          await prisma.emptyLeg.update({
            where: { id: existingDeal.id },
            data: {
              ...enrichedData,
              // Don't override these fields
              slug: undefined,
              externalId: undefined,
              source: undefined,
            },
          });
          result.dealsUpdated++;
        } else {
          // Create new deal - ensure unique slug
          let slug = baseSlug;
          let counter = 1;
          while (await prisma.emptyLeg.findUnique({ where: { slug } })) {
            slug = `${baseSlug}-${counter}`;
            counter++;
          }

          await prisma.emptyLeg.create({
            data: {
              ...enrichedData,
              slug,
            },
          });
          result.dealsCreated++;
        }
      } catch (dealError) {
        const errorMsg = `Error processing deal ${apiDeal.id}: ${dealError instanceof Error ? dealError.message : "Unknown error"}`;
        console.error(`[InstaCharter Sync] ${errorMsg}`);
        result.errors.push(errorMsg);
      }
    }

    console.log(
      `[InstaCharter Sync] Skipped ${dealsSkipped} deals due to missing required fields`,
    );

    // 4. Delete deals that are no longer in InstaCharter API
    for (const [externalId, existingDeal] of Array.from(existingDealMap)) {
      if (!apiDealIds.has(externalId!)) {
        try {
          await prisma.emptyLeg.delete({
            where: { id: existingDeal.id },
          });
          result.dealsRemoved++;
          console.log(
            `[InstaCharter Sync] Deleted deal ${externalId} (no longer in API)`,
          );
        } catch (removeError) {
          const errorMsg = `Error deleting deal ${externalId}: ${removeError instanceof Error ? removeError.message : "Unknown error"}`;
          console.error(`[InstaCharter Sync] ${errorMsg}`);
          result.errors.push(errorMsg);
        }
      }
    }

    result.success = result.errors.length === 0;
    result.duration = Date.now() - startTime;

    // 5. Update sync log with success
    await prisma.instaCharterSyncLog.update({
      where: { id: syncLog.id },
      data: {
        status: result.success ? "COMPLETED" : "COMPLETED",
        dealsFound: result.dealsFound,
        dealsCreated: result.dealsCreated,
        dealsUpdated: result.dealsUpdated,
        dealsRemoved: result.dealsRemoved,
        errorMessage:
          result.errors.length > 0
            ? `${result.errors.length} errors occurred`
            : null,
        errorDetails:
          result.errors.length > 0 ? JSON.stringify(result.errors) : null,
        completedAt: new Date(),
        durationMs: result.duration,
      },
    });

    console.log(
      `[InstaCharter Sync] Completed: ${result.dealsCreated} created, ${result.dealsUpdated} updated, ${result.dealsRemoved} removed, ${dealsSkipped} skipped (incomplete) (${result.duration}ms)`,
    );

    return result;
  } catch (error) {
    result.success = false;
    result.duration = Date.now() - startTime;
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    result.errors.push(errorMessage);

    // Update sync log with failure
    await prisma.instaCharterSyncLog.update({
      where: { id: syncLog.id },
      data: {
        status: "FAILED",
        errorMessage,
        errorDetails: JSON.stringify({
          error: errorMessage,
          stack: error instanceof Error ? error.stack : undefined,
        }),
        completedAt: new Date(),
        durationMs: result.duration,
      },
    });

    console.error(`[InstaCharter Sync] Failed: ${errorMessage}`);
    return result;
  }
}

/**
 * Get the last sync status
 */
export async function getLastSyncStatus(prisma: PrismaClient): Promise<{
  lastSync: Date | null;
  status: string | null;
  dealsCount: number;
  nextScheduledSync: Date;
}> {
  const lastSyncLog = await prisma.instaCharterSyncLog.findFirst({
    orderBy: { startedAt: "desc" },
  });

  const dealsCount = await prisma.emptyLeg.count({
    where: {
      source: "INSTACHARTER",
    },
  });

  // Calculate next scheduled sync (midnight UTC)
  const now = new Date();
  const nextSync = new Date(now);
  nextSync.setUTCHours(0, 0, 0, 0);
  if (nextSync <= now) {
    nextSync.setUTCDate(nextSync.getUTCDate() + 1);
  }

  return {
    lastSync: lastSyncLog?.completedAt || lastSyncLog?.startedAt || null,
    status: lastSyncLog?.status || null,
    dealsCount,
    nextScheduledSync: nextSync,
  };
}

/**
 * Get sync history
 */
export async function getSyncHistory(
  prisma: PrismaClient,
  limit: number = 10,
): Promise<
  Array<{
    id: string;
    syncType: string;
    status: string;
    dealsFound: number;
    dealsCreated: number;
    dealsUpdated: number;
    dealsRemoved: number;
    errorMessage: string | null;
    startedAt: Date;
    completedAt: Date | null;
    durationMs: number | null;
  }>
> {
  return prisma.instaCharterSyncLog.findMany({
    orderBy: { startedAt: "desc" },
    take: limit,
    select: {
      id: true,
      syncType: true,
      status: true,
      dealsFound: true,
      dealsCreated: true,
      dealsUpdated: true,
      dealsRemoved: true,
      errorMessage: true,
      startedAt: true,
      completedAt: true,
      durationMs: true,
    },
  });
}

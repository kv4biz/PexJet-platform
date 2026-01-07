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
  city: string | null;
  country: string | null;
  latitude: number;
  longitude: number;
}

/**
 * Find airport by ICAO code (searches both icaoCode and gpsCode fields)
 * Returns full airport data for populating EmptyLeg fields
 */
async function findAirportByIcao(
  prisma: PrismaClient,
  icaoCode: string | null | undefined,
): Promise<AirportLookupResult | null> {
  if (!icaoCode) return null;

  const code = icaoCode.toUpperCase();

  try {
    // Search both icaoCode and gpsCode fields
    const airport = await prisma.airport.findFirst({
      where: {
        OR: [{ icaoCode: code }, { gpsCode: code }],
      },
      select: {
        id: true,
        iataCode: true,
        icaoCode: true,
        municipality: true,
        latitude: true,
        longitude: true,
        country: {
          select: { name: true },
        },
      },
    });

    if (!airport) {
      console.log(
        `[InstaCharter Sync] No airport found for ICAO/GPS code: ${code}`,
      );
      return null;
    }

    console.log(
      `[InstaCharter Sync] Found airport: ${airport.iataCode || airport.icaoCode} (${airport.municipality}) for code ${code}`,
    );

    return {
      id: airport.id,
      iataCode: airport.iataCode,
      icaoCode: airport.icaoCode,
      city: airport.municipality,
      country: airport.country?.name || null,
      latitude: airport.latitude,
      longitude: airport.longitude,
    };
  } catch (error) {
    console.error(
      `[InstaCharter Sync] Error finding airport by ICAO/GPS ${code}:`,
      error,
    );
    return null;
  }
}

// =============================================================================
// Sync Service
// =============================================================================

/**
 * Sync InstaCharter empty leg deals to database
 * - Fetches all one-way deals within 6 months from InstaCharter API
 * - Creates new deals that don't exist in our database
 * - Updates existing deals with latest info
 * - Marks deals as UNAVAILABLE if no longer in InstaCharter API
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

    // 3. Process each deal from API
    for (const apiDeal of apiDeals) {
      try {
        const mappedData = mapAvailabilityToEmptyLeg(apiDeal);
        const externalId = apiDeal.id.toString();
        const existingDeal = existingDealMap.get(externalId);

        // Look up airports by ICAO code (searches both icaoCode and gpsCode fields)
        const departureAirport = await findAirportByIcao(
          prisma,
          mappedData.departureIcao,
        );
        const arrivalAirport = await findAirportByIcao(
          prisma,
          mappedData.arrivalIcao,
        );

        // Generate slug using city names (not ICAO codes)
        // Use resolved city names from our database, fallback to InstaCharter city names
        const departureCity =
          departureAirport?.city || mappedData.departureCity || "unknown";
        const arrivalCity =
          arrivalAirport?.city || mappedData.arrivalCity || "unknown";
        const dateStr = mappedData.departureDateTime
          .toISOString()
          .split("T")[0];
        const baseSlug =
          `${departureCity}-to-${arrivalCity}-${dateStr}-ic-${mappedData.externalId}`
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, "-")
            .replace(/-+/g, "-");

        // Prepare data with resolved airport info
        const enrichedData = {
          ...mappedData,
          // Override with resolved city/country from our database
          departureCity: departureAirport?.city || mappedData.departureCity,
          departureCountry:
            departureAirport?.country || mappedData.departureCountry,
          arrivalCity: arrivalAirport?.city || mappedData.arrivalCity,
          arrivalCountry: arrivalAirport?.country || mappedData.arrivalCountry,
          // Link to airport records if found
          departureAirportId: departureAirport?.id || undefined,
          arrivalAirportId: arrivalAirport?.id || undefined,
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
              // Re-publish if it was marked unavailable but is now back
              status:
                existingDeal.status === "UNAVAILABLE" ? "PUBLISHED" : undefined,
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

    // 4. Mark deals as UNAVAILABLE if no longer in API
    for (const [externalId, existingDeal] of Array.from(existingDealMap)) {
      if (
        !apiDealIds.has(externalId!) &&
        existingDeal.status !== "UNAVAILABLE"
      ) {
        try {
          await prisma.emptyLeg.update({
            where: { id: existingDeal.id },
            data: { status: "UNAVAILABLE" },
          });
          result.dealsRemoved++;
        } catch (removeError) {
          const errorMsg = `Error marking deal ${externalId} as unavailable: ${removeError instanceof Error ? removeError.message : "Unknown error"}`;
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
      `[InstaCharter Sync] Completed: ${result.dealsCreated} created, ${result.dealsUpdated} updated, ${result.dealsRemoved} removed (${result.duration}ms)`,
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
      status: { not: "UNAVAILABLE" },
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

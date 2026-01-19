import { PrismaClient, AircraftCategory } from "@prisma/client";

const prisma = new PrismaClient();

// Base prices per hour for each category (in USD)
const BASE_PRICES_PER_HOUR: Record<AircraftCategory, number> = {
  LIGHT: 2500, // Light Jet: ~$2,500/hour
  MIDSIZE: 3500, // Midsize Jet: ~$3,500/hour
  SUPER_MIDSIZE: 4500, // Super Midsize: ~$4,500/hour
  ULTRA_LONG_RANGE: 6500, // Ultra Long Range: ~$6,500/hour
  HEAVY: 5500, // Heavy Jet: ~$5,500/hour
};

/**
 * Get sample aircraft for each category
 * Returns the first available aircraft in each category
 */
export async function getSampleAircraftByCategory() {
  const categories: AircraftCategory[] = [
    "LIGHT",
    "MIDSIZE",
    "SUPER_MIDSIZE",
    "ULTRA_LONG_RANGE",
    "HEAVY",
  ];

  const samples = await Promise.all(
    categories.map(async (category) => {
      const aircraft = await prisma.aircraft.findFirst({
        where: { category },
        select: {
          id: true,
          name: true,
          manufacturer: true,
          category: true,
          image: true,
          cruiseSpeedKnots: true,
          maxPax: true,
          basePricePerHour: true,
        },
        orderBy: { name: "asc" },
      });

      return {
        category,
        aircraft: aircraft
          ? {
              ...aircraft,
              basePricePerHour:
                aircraft.basePricePerHour || BASE_PRICES_PER_HOUR[category],
            }
          : null,
      };
    }),
  );

  // Filter out categories with no aircraft
  return samples.filter((s) => s.aircraft !== null);
}

/**
 * Update base prices for all aircraft
 * Sets the base price per hour based on category if not already set
 */
export async function updateBasePrices() {
  const aircraft = await prisma.aircraft.findMany({
    where: { basePricePerHour: null },
    select: { id: true, category: true },
  });

  const updates = aircraft.map((a) =>
    prisma.aircraft.update({
      where: { id: a.id },
      data: { basePricePerHour: BASE_PRICES_PER_HOUR[a.category] },
    }),
  );

  await Promise.all(updates);

  console.log(`Updated base prices for ${updates.length} aircraft`);
}

/**
 * Calculate estimated price for a charter flight
 */
export function calculateCharterPrice(
  durationHours: number,
  basePricePerHour: number,
  margin: number = 0.2, // 20% margin by default
): number {
  const baseCost = durationHours * basePricePerHour;
  const totalCost = baseCost * (1 + margin);
  return Math.round(totalCost);
}

/**
 * Get flight duration in hours based on distance and speed
 */
export function calculateFlightDuration(
  distanceNm: number,
  cruiseSpeedKnots: number,
): number {
  return distanceNm / cruiseSpeedKnots;
}

// Helper functions
export { BASE_PRICES_PER_HOUR };

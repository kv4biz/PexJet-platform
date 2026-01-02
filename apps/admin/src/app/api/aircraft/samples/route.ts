import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Base prices per hour for each category (in USD)
const BASE_PRICES_PER_HOUR = {
  LIGHT: 2500, // Light Jet: ~$2,500/hour
  MIDSIZE: 3500, // Midsize Jet: ~$3,500/hour
  SUPER_MIDSIZE: 4500, // Super Midsize: ~$4,500/hour
  ULTRA_LONG_RANGE: 6500, // Ultra Long Range: ~$6,500/hour
  HEAVY: 5500, // Heavy Jet: ~$5,500/hour
};

export async function GET(request: NextRequest) {
  try {
    const categories = [
      "LIGHT",
      "MIDSIZE",
      "SUPER_MIDSIZE",
      "ULTRA_LONG_RANGE",
      "HEAVY",
    ];

    const samples = await Promise.all(
      categories.map(async (category) => {
        const aircraft = await prisma.aircraft.findFirst({
          where: { category: category as any },
          select: {
            id: true,
            name: true,
            manufacturer: true,
            category: true,
            image: true,
            cruiseSpeedKnots: true,
            maxPax: true,
            // Use raw query to get basePricePerHour since it might not be in the generated types yet
          },
          orderBy: { name: "asc" },
        });

        // Get base price using raw query
        let basePricePerHour =
          BASE_PRICES_PER_HOUR[category as keyof typeof BASE_PRICES_PER_HOUR];
        if (aircraft) {
          const result =
            await prisma.$queryRaw`SELECT "basePricePerHour" FROM "Aircraft" WHERE id = ${aircraft.id}`;
          if (
            Array.isArray(result) &&
            result[0] &&
            (result[0] as any).basePricePerHour
          ) {
            basePricePerHour = (result[0] as any).basePricePerHour;
          }
        }

        return {
          category,
          aircraft: aircraft
            ? {
                ...aircraft,
                basePricePerHour:
                  basePricePerHour ||
                  BASE_PRICES_PER_HOUR[
                    category as keyof typeof BASE_PRICES_PER_HOUR
                  ],
              }
            : null,
        };
      }),
    );

    // Filter out categories with no aircraft
    const availableSamples = samples.filter((s) => s.aircraft !== null);

    return NextResponse.json({
      success: true,
      data: availableSamples,
    });
  } catch (error: any) {
    console.error("Error fetching sample aircraft:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch sample aircraft",
        message: error.message,
      },
      { status: 500 },
    );
  } finally {
    await prisma.$disconnect();
  }
}

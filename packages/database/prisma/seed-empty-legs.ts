import { PrismaClient, EmptyLegStatus } from "@prisma/client";

const prisma = new PrismaClient();

function generateSlug(from: string, to: string, date: Date): string {
  const fromCode = from.toLowerCase().replace(/\s+/g, "-");
  const toCode = to.toLowerCase().replace(/\s+/g, "-");
  const dateStr = date.toISOString().split("T")[0];
  return `${fromCode}-to-${toCode}-${dateStr}`;
}

async function seedEmptyLegs() {
  console.log("🛫 Seeding sample empty legs...");

  // Get the super admin
  const admin = await prisma.admin.findFirst({
    where: { email: "ademola@pexjet.com" },
  });

  if (!admin) {
    console.error("❌ Super admin not found. Run main seed first.");
    return;
  }

  // Get sample airports (major international airports)
  let airports = await prisma.airport.findMany({
    where: {
      type: "large_airport",
      iataCode: { in: ["LOS", "ABV", "JFK", "LHR", "DXB", "CDG"] },
    },
  });

  if (airports.length < 6) {
    // Fallback to any large airports
    const fallbackAirports = await prisma.airport.findMany({
      where: { type: "large_airport" },
      take: 6,
    });
    // Merge without duplicates
    const existingIds = new Set(airports.map((a) => a.id));
    for (const a of fallbackAirports) {
      if (!existingIds.has(a.id)) {
        airports.push(a);
      }
    }
  }

  console.log(`  Found ${airports.length} airports for routes`);
  airports.forEach((a, i) =>
    console.log(`    ${i}: ${a.name} (${a.iataCode || a.ident})`),
  );

  // Get aircraft
  const aircraft = await prisma.aircraft.findMany();
  if (aircraft.length === 0) {
    console.error("❌ No aircraft found. Run main seed first.");
    return;
  }

  console.log(`  Found ${aircraft.length} aircraft`);

  // Create 3 sample empty legs
  const now = new Date();
  const emptyLegs = [
    {
      slug: generateSlug(
        "route1",
        "flight",
        new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      ),
      departureAirportId: airports[0]?.id,
      arrivalAirportId: airports[1]?.id,
      departureDateTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      aircraftId: aircraft[0]?.id,
      totalSeats: aircraft[0]?.passengerCapacityMax || 8,
      availableSeats: aircraft[0]?.passengerCapacityMax || 8,
      originalPriceUsd: 2500,
      discountPriceUsd: 1800,
      status: EmptyLegStatus.PUBLISHED,
      createdByAdminId: admin.id,
    },
    {
      slug: generateSlug(
        "route2",
        "flight",
        new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
      ),
      departureAirportId: airports[2]?.id || airports[0]?.id,
      arrivalAirportId: airports[3]?.id || airports[1]?.id,
      departureDateTime: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      aircraftId: aircraft[1]?.id || aircraft[0]?.id,
      totalSeats: (aircraft[1] || aircraft[0])?.passengerCapacityMax || 10,
      availableSeats: (aircraft[1] || aircraft[0])?.passengerCapacityMax || 10,
      originalPriceUsd: 4500,
      discountPriceUsd: 3200,
      status: EmptyLegStatus.PUBLISHED,
      createdByAdminId: admin.id,
    },
    {
      slug: generateSlug(
        "route3",
        "flight",
        new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      ),
      departureAirportId: airports[4]?.id || airports[0]?.id,
      arrivalAirportId: airports[5]?.id || airports[1]?.id,
      departureDateTime: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      aircraftId: aircraft[2]?.id || aircraft[0]?.id,
      totalSeats: (aircraft[2] || aircraft[0])?.passengerCapacityMax || 14,
      availableSeats: (aircraft[2] || aircraft[0])?.passengerCapacityMax || 14,
      originalPriceUsd: 15000,
      discountPriceUsd: 9500,
      status: EmptyLegStatus.PUBLISHED,
      createdByAdminId: admin.id,
    },
  ];

  for (const leg of emptyLegs) {
    try {
      await prisma.emptyLeg.upsert({
        where: { slug: leg.slug },
        update: {},
        create: leg,
      });
      console.log(`  ✅ Created: ${leg.slug}`);
    } catch (e: any) {
      console.error(`  ❌ Failed: ${leg.slug} - ${e.message}`);
    }
  }

  const count = await prisma.emptyLeg.count();
  console.log(`✅ Total empty legs: ${count}`);
}

async function main() {
  await seedEmptyLegs();
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

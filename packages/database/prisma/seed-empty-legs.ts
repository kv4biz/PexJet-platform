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
      iataCode: {
        in: [
          "LOS",
          "ABV",
          "JFK",
          "LHR",
          "DXB",
          "CDG",
          "PHC",
          "KAN",
          "ACC",
          "NBO",
          "JNB",
          "CAI",
          "AMS",
          "FRA",
          "MIA",
          "LAX",
        ],
      },
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

  // Create sample empty legs with diverse routes
  const now = new Date();
  const getAirport = (index: number) => airports[index % airports.length];
  const getAircraft = (index: number) => aircraft[index % aircraft.length];

  const emptyLegs = [
    // Nigeria domestic routes
    {
      slug: generateSlug(
        "lagos",
        "abuja",
        new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      ),
      departureAirportId: getAirport(0)?.id,
      arrivalAirportId: getAirport(1)?.id,
      departureDateTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      aircraftId: getAircraft(0)?.id,
      totalSeats: getAircraft(0)?.passengerCapacityMax || 8,
      availableSeats: getAircraft(0)?.passengerCapacityMax || 8,
      originalPriceUsd: 3500,
      discountPriceUsd: 2200,
      status: EmptyLegStatus.PUBLISHED,
      createdByAdminId: admin.id,
    },
    {
      slug: generateSlug(
        "abuja",
        "lagos",
        new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      ),
      departureAirportId: getAirport(1)?.id,
      arrivalAirportId: getAirport(0)?.id,
      departureDateTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      aircraftId: getAircraft(1)?.id,
      totalSeats: getAircraft(1)?.passengerCapacityMax || 6,
      availableSeats: getAircraft(1)?.passengerCapacityMax || 6,
      originalPriceUsd: 3200,
      discountPriceUsd: 1900,
      status: EmptyLegStatus.PUBLISHED,
      createdByAdminId: admin.id,
    },
    {
      slug: generateSlug(
        "lagos",
        "portharcourt",
        new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000),
      ),
      departureAirportId: getAirport(0)?.id,
      arrivalAirportId: getAirport(6)?.id,
      departureDateTime: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000),
      aircraftId: getAircraft(2)?.id,
      totalSeats: getAircraft(2)?.passengerCapacityMax || 8,
      availableSeats: getAircraft(2)?.passengerCapacityMax || 8,
      originalPriceUsd: 2800,
      discountPriceUsd: 1600,
      status: EmptyLegStatus.PUBLISHED,
      createdByAdminId: admin.id,
    },
    // Africa regional routes
    {
      slug: generateSlug(
        "lagos",
        "accra",
        new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
      ),
      departureAirportId: getAirport(0)?.id,
      arrivalAirportId: getAirport(8)?.id,
      departureDateTime: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
      aircraftId: getAircraft(0)?.id,
      totalSeats: getAircraft(0)?.passengerCapacityMax || 8,
      availableSeats: getAircraft(0)?.passengerCapacityMax || 8,
      originalPriceUsd: 5500,
      discountPriceUsd: 3800,
      status: EmptyLegStatus.PUBLISHED,
      createdByAdminId: admin.id,
    },
    {
      slug: generateSlug(
        "abuja",
        "nairobi",
        new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000),
      ),
      departureAirportId: getAirport(1)?.id,
      arrivalAirportId: getAirport(9)?.id,
      departureDateTime: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000),
      aircraftId: getAircraft(1)?.id,
      totalSeats: getAircraft(1)?.passengerCapacityMax || 10,
      availableSeats: getAircraft(1)?.passengerCapacityMax || 10,
      originalPriceUsd: 12000,
      discountPriceUsd: 8500,
      status: EmptyLegStatus.PUBLISHED,
      createdByAdminId: admin.id,
    },
    {
      slug: generateSlug(
        "lagos",
        "johannesburg",
        new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      ),
      departureAirportId: getAirport(0)?.id,
      arrivalAirportId: getAirport(10)?.id,
      departureDateTime: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      aircraftId: getAircraft(2)?.id,
      totalSeats: getAircraft(2)?.passengerCapacityMax || 12,
      availableSeats: getAircraft(2)?.passengerCapacityMax || 12,
      originalPriceUsd: 18000,
      discountPriceUsd: 12500,
      status: EmptyLegStatus.PUBLISHED,
      createdByAdminId: admin.id,
    },
    {
      slug: generateSlug(
        "accra",
        "cairo",
        new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000),
      ),
      departureAirportId: getAirport(8)?.id,
      arrivalAirportId: getAirport(11)?.id,
      departureDateTime: new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000),
      aircraftId: getAircraft(0)?.id,
      totalSeats: getAircraft(0)?.passengerCapacityMax || 8,
      availableSeats: getAircraft(0)?.passengerCapacityMax || 8,
      originalPriceUsd: 14000,
      discountPriceUsd: 9800,
      status: EmptyLegStatus.PUBLISHED,
      createdByAdminId: admin.id,
    },
    // International routes
    {
      slug: generateSlug(
        "lagos",
        "london",
        new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
      ),
      departureAirportId: getAirport(0)?.id,
      arrivalAirportId: getAirport(3)?.id,
      departureDateTime: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
      aircraftId: getAircraft(2)?.id,
      totalSeats: getAircraft(2)?.passengerCapacityMax || 14,
      availableSeats: getAircraft(2)?.passengerCapacityMax || 14,
      originalPriceUsd: 45000,
      discountPriceUsd: 32000,
      status: EmptyLegStatus.PUBLISHED,
      createdByAdminId: admin.id,
    },
    {
      slug: generateSlug(
        "london",
        "lagos",
        new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000),
      ),
      departureAirportId: getAirport(3)?.id,
      arrivalAirportId: getAirport(0)?.id,
      departureDateTime: new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000),
      aircraftId: getAircraft(1)?.id,
      totalSeats: getAircraft(1)?.passengerCapacityMax || 10,
      availableSeats: getAircraft(1)?.passengerCapacityMax || 10,
      originalPriceUsd: 42000,
      discountPriceUsd: 28000,
      status: EmptyLegStatus.PUBLISHED,
      createdByAdminId: admin.id,
    },
    {
      slug: generateSlug(
        "abuja",
        "dubai",
        new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
      ),
      departureAirportId: getAirport(1)?.id,
      arrivalAirportId: getAirport(4)?.id,
      departureDateTime: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
      aircraftId: getAircraft(2)?.id,
      totalSeats: getAircraft(2)?.passengerCapacityMax || 12,
      availableSeats: getAircraft(2)?.passengerCapacityMax || 12,
      originalPriceUsd: 38000,
      discountPriceUsd: 26500,
      status: EmptyLegStatus.PUBLISHED,
      createdByAdminId: admin.id,
    },
    {
      slug: generateSlug(
        "dubai",
        "lagos",
        new Date(now.getTime() + 16 * 24 * 60 * 60 * 1000),
      ),
      departureAirportId: getAirport(4)?.id,
      arrivalAirportId: getAirport(0)?.id,
      departureDateTime: new Date(now.getTime() + 16 * 24 * 60 * 60 * 1000),
      aircraftId: getAircraft(0)?.id,
      totalSeats: getAircraft(0)?.passengerCapacityMax || 8,
      availableSeats: getAircraft(0)?.passengerCapacityMax || 8,
      originalPriceUsd: 35000,
      discountPriceUsd: 24000,
      status: EmptyLegStatus.PUBLISHED,
      createdByAdminId: admin.id,
    },
    {
      slug: generateSlug(
        "lagos",
        "paris",
        new Date(now.getTime() + 18 * 24 * 60 * 60 * 1000),
      ),
      departureAirportId: getAirport(0)?.id,
      arrivalAirportId: getAirport(5)?.id,
      departureDateTime: new Date(now.getTime() + 18 * 24 * 60 * 60 * 1000),
      aircraftId: getAircraft(1)?.id,
      totalSeats: getAircraft(1)?.passengerCapacityMax || 10,
      availableSeats: getAircraft(1)?.passengerCapacityMax || 10,
      originalPriceUsd: 48000,
      discountPriceUsd: 34000,
      status: EmptyLegStatus.PUBLISHED,
      createdByAdminId: admin.id,
    },
    {
      slug: generateSlug(
        "paris",
        "abuja",
        new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000),
      ),
      departureAirportId: getAirport(5)?.id,
      arrivalAirportId: getAirport(1)?.id,
      departureDateTime: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000),
      aircraftId: getAircraft(2)?.id,
      totalSeats: getAircraft(2)?.passengerCapacityMax || 14,
      availableSeats: getAircraft(2)?.passengerCapacityMax || 14,
      originalPriceUsd: 46000,
      discountPriceUsd: 31000,
      status: EmptyLegStatus.PUBLISHED,
      createdByAdminId: admin.id,
    },
    {
      slug: generateSlug(
        "lagos",
        "newyork",
        new Date(now.getTime() + 22 * 24 * 60 * 60 * 1000),
      ),
      departureAirportId: getAirport(0)?.id,
      arrivalAirportId: getAirport(2)?.id,
      departureDateTime: new Date(now.getTime() + 22 * 24 * 60 * 60 * 1000),
      aircraftId: getAircraft(2)?.id,
      totalSeats: getAircraft(2)?.passengerCapacityMax || 14,
      availableSeats: getAircraft(2)?.passengerCapacityMax || 14,
      originalPriceUsd: 85000,
      discountPriceUsd: 62000,
      status: EmptyLegStatus.PUBLISHED,
      createdByAdminId: admin.id,
    },
    {
      slug: generateSlug(
        "newyork",
        "lagos",
        new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000),
      ),
      departureAirportId: getAirport(2)?.id,
      arrivalAirportId: getAirport(0)?.id,
      departureDateTime: new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000),
      aircraftId: getAircraft(1)?.id,
      totalSeats: getAircraft(1)?.passengerCapacityMax || 10,
      availableSeats: getAircraft(1)?.passengerCapacityMax || 10,
      originalPriceUsd: 78000,
      discountPriceUsd: 55000,
      status: EmptyLegStatus.PUBLISHED,
      createdByAdminId: admin.id,
    },
    // European routes
    {
      slug: generateSlug(
        "london",
        "amsterdam",
        new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000),
      ),
      departureAirportId: getAirport(3)?.id,
      arrivalAirportId: getAirport(12)?.id,
      departureDateTime: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000),
      aircraftId: getAircraft(0)?.id,
      totalSeats: getAircraft(0)?.passengerCapacityMax || 6,
      availableSeats: getAircraft(0)?.passengerCapacityMax || 6,
      originalPriceUsd: 8500,
      discountPriceUsd: 5200,
      status: EmptyLegStatus.PUBLISHED,
      createdByAdminId: admin.id,
    },
    {
      slug: generateSlug(
        "frankfurt",
        "dubai",
        new Date(now.getTime() + 9 * 24 * 60 * 60 * 1000),
      ),
      departureAirportId: getAirport(13)?.id,
      arrivalAirportId: getAirport(4)?.id,
      departureDateTime: new Date(now.getTime() + 9 * 24 * 60 * 60 * 1000),
      aircraftId: getAircraft(1)?.id,
      totalSeats: getAircraft(1)?.passengerCapacityMax || 10,
      availableSeats: getAircraft(1)?.passengerCapacityMax || 10,
      originalPriceUsd: 28000,
      discountPriceUsd: 19500,
      status: EmptyLegStatus.PUBLISHED,
      createdByAdminId: admin.id,
    },
    // US routes
    {
      slug: generateSlug(
        "miami",
        "newyork",
        new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
      ),
      departureAirportId: getAirport(14)?.id,
      arrivalAirportId: getAirport(2)?.id,
      departureDateTime: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
      aircraftId: getAircraft(0)?.id,
      totalSeats: getAircraft(0)?.passengerCapacityMax || 8,
      availableSeats: getAircraft(0)?.passengerCapacityMax || 8,
      originalPriceUsd: 12000,
      discountPriceUsd: 7800,
      status: EmptyLegStatus.PUBLISHED,
      createdByAdminId: admin.id,
    },
    {
      slug: generateSlug(
        "losangeles",
        "miami",
        new Date(now.getTime() + 11 * 24 * 60 * 60 * 1000),
      ),
      departureAirportId: getAirport(15)?.id,
      arrivalAirportId: getAirport(14)?.id,
      departureDateTime: new Date(now.getTime() + 11 * 24 * 60 * 60 * 1000),
      aircraftId: getAircraft(2)?.id,
      totalSeats: getAircraft(2)?.passengerCapacityMax || 12,
      availableSeats: getAircraft(2)?.passengerCapacityMax || 12,
      originalPriceUsd: 22000,
      discountPriceUsd: 15500,
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

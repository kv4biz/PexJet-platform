import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function searchAnambraAirports() {
  console.log("🔍 Searching for airports in Anambra State (NG-AN)...\n");

  // Search by region code for Anambra
  const anambraAirports = await prisma.airport.findMany({
    where: { regionCode: "NG-AN" },
    include: {
      country: { select: { name: true, code: true } },
      region: { select: { name: true, code: true } },
    },
    orderBy: { name: "asc" },
  });

  if (anambraAirports.length > 0) {
    console.log(`✅ Found ${anambraAirports.length} airport(s) in Anambra:\n`);
    anambraAirports.forEach((airport, index) => {
      console.log(`${index + 1}. ${airport.name}`);
      console.log(`   Ident: ${airport.ident}`);
      console.log(`   Type: ${airport.type}`);
      console.log(`   IATA: ${airport.iataCode || "N/A"}`);
      console.log(`   ICAO: ${airport.icaoCode || "N/A"}`);
      console.log(`   City: ${airport.municipality || "N/A"}`);
      console.log(`   Coordinates: ${airport.latitude}, ${airport.longitude}`);
      console.log(`   Region: ${airport.region?.name} (${airport.regionCode})`);
      console.log(
        `   Country: ${airport.country?.name} (${airport.countryCode})`,
      );
      console.log("");
    });
  } else {
    console.log("❌ No airports found in Anambra State (NG-AN)");

    // Check if region exists
    const region = await prisma.region.findUnique({
      where: { code: "NG-AN" },
    });

    if (region) {
      console.log(`\n📍 Region exists: ${region.name} (${region.code})`);
    } else {
      console.log("\n⚠️ Region NG-AN not found in database");
    }
  }

  // Also search by name containing "Anambra" or nearby cities
  console.log(
    "\n🔍 Also searching by name/municipality containing Anambra-related terms...\n",
  );

  const relatedAirports = await prisma.airport.findMany({
    where: {
      countryCode: "NG",
      OR: [
        { name: { contains: "Anambra", mode: "insensitive" } },
        { municipality: { contains: "Anambra", mode: "insensitive" } },
        { municipality: { contains: "Onitsha", mode: "insensitive" } },
        { municipality: { contains: "Awka", mode: "insensitive" } },
        { municipality: { contains: "Nnewi", mode: "insensitive" } },
        { name: { contains: "Onitsha", mode: "insensitive" } },
        { name: { contains: "Awka", mode: "insensitive" } },
      ],
    },
    include: {
      country: { select: { name: true } },
      region: { select: { name: true } },
    },
  });

  if (relatedAirports.length > 0) {
    console.log(`Found ${relatedAirports.length} related airport(s):\n`);
    relatedAirports.forEach((airport, index) => {
      console.log(`${index + 1}. ${airport.name}`);
      console.log(`   Ident: ${airport.ident}`);
      console.log(`   Type: ${airport.type}`);
      console.log(`   IATA: ${airport.iataCode || "N/A"}`);
      console.log(`   ICAO: ${airport.icaoCode || "N/A"}`);
      console.log(`   City: ${airport.municipality || "N/A"}`);
      console.log(`   Region: ${airport.region?.name} (${airport.regionCode})`);
      console.log("");
    });
  } else {
    console.log("No airports found with Anambra-related names");
  }

  await prisma.$disconnect();
}

searchAnambraAirports().catch(console.error);

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function checkNigerianAirports() {
  const nigerianAirports = await prisma.airport.findMany({
    where: { countryCode: "NG" },
    select: {
      ident: true,
      name: true,
      type: true,
      municipality: true,
      iataCode: true,
      icaoCode: true,
    },
    orderBy: { type: "asc" },
  });

  console.log(`🇳🇬 Nigerian Airports in Database: ${nigerianAirports.length}\n`);

  const byType = nigerianAirports.reduce(
    (acc, airport) => {
      acc[airport.type] = (acc[airport.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  console.log("By Type:");
  Object.entries(byType).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });

  console.log("\nMajor Airports (with IATA codes):");
  const majorAirports = nigerianAirports.filter((a) => a.iataCode);
  majorAirports.slice(0, 15).forEach((airport) => {
    console.log(
      `  ${airport.iataCode} - ${airport.name} (${airport.municipality}) - ${airport.type}`,
    );
  });

  if (majorAirports.length > 15) {
    console.log(`  ... and ${majorAirports.length - 15} more`);
  }

  console.log(
    `\nTotal Nigerian airports with IATA codes: ${majorAirports.length}`,
  );

  await prisma.$disconnect();
}

checkNigerianAirports().catch(console.error);

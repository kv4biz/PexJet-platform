import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function checkPortHarcourt() {
  const airport = await prisma.airport.findUnique({
    where: { ident: "DNPO" },
    include: {
      country: { select: { name: true, code: true } },
      region: { select: { name: true, code: true } },
    },
  });

  if (airport) {
    console.log("✅ Port Harcourt Airport Found in Database:");
    console.log("   Ident:", airport.ident);
    console.log("   Name:", airport.name);
    console.log("   Type:", airport.type);
    console.log("   IATA:", airport.iataCode);
    console.log("   ICAO:", airport.icaoCode);
    console.log("   GPS:", airport.gpsCode);
    console.log("   Coordinates:", airport.latitude, airport.longitude);
    console.log("   Elevation:", airport.elevationFt, "ft");
    console.log("   City:", airport.municipality);
    console.log(
      "   Country:",
      airport.country?.name,
      "(",
      airport.countryCode,
      ")",
    );
    console.log(
      "   State:",
      airport.region?.name,
      "(",
      airport.regionCode,
      ")",
    );
    console.log("   Scheduled Service:", airport.scheduledService);

    console.log("\n📊 Comparison with your data:");
    console.log("   Your coordinates: 5.01549, 6.94959");
    console.log("   Database coords:  ", airport.latitude, airport.longitude);
    console.log("   Your elevation: 87 ft");
    console.log("   Database elev:   ", airport.elevationFt, "ft");
  } else {
    console.log("❌ Port Harcourt Airport not found");
  }

  await prisma.$disconnect();
}

checkPortHarcourt().catch(console.error);

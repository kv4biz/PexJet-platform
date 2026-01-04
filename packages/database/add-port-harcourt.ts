import { PrismaClient, AirportType } from "@prisma/client";
const prisma = new PrismaClient();

async function addPortHarcourtAirport() {
  console.log("✈️ Adding Port Harcourt Airport to Database\n");

  // Port Harcourt International Airport data
  const portHarcourtAirport = {
    // Basic Information (REQUIRED)
    ident: "DNPO", // Airport identifier
    type: "medium_airport" as AirportType, // Airport type
    name: "Port Harcourt International Airport", // Full airport name
    latitude: 5.01549, // Latitude coordinates
    longitude: 6.94959, // Longitude coordinates
    elevationFt: 87, // Elevation in feet
    continent: "AF", // Continent code
    countryCode: "NG", // ISO country code
    regionCode: "NG-RI", // ISO region code (Rivers State)

    // Location Information (REQUIRED)
    municipality: "Port Harcourt", // City name
    scheduledService: true, // Has scheduled service

    // Airport Codes (RECOMMENDED)
    icaoCode: "DNPO", // ICAO code
    iataCode: "PHC", // IATA code
    gpsCode: "DNPO", // GPS code
    localCode: null, // Local code

    // Additional Information (OPTIONAL)
    homeLink: null,
    wikipediaLink: "https://en.wikipedia.org/wiki/Port_Harcourt_Airport",
    keywords: "Port Harcourt, Omagwa, Rivers State, Nigeria",
  };

  try {
    // Check if airport already exists
    const existing = await prisma.airport.findUnique({
      where: { ident: portHarcourtAirport.ident },
    });

    if (existing) {
      console.log(
        `❌ Airport ${portHarcourtAirport.ident} already exists in database!`,
      );
      console.log("   Name:", existing.name);
      console.log("   Type:", existing.type);
      return;
    }

    // Check if country and region exist
    const nigeria = await prisma.country.findUnique({
      where: { code: "NG" },
    });

    if (!nigeria) {
      console.log(
        "❌ Nigeria (NG) not found in countries table. Please seed countries first.",
      );
      return;
    }

    const riversState = await prisma.region.findUnique({
      where: { code: "NG-RI" },
    });

    if (!riversState) {
      console.log(
        "❌ Rivers State (NG-RI) not found in regions table. Please seed regions first.",
      );
      return;
    }

    // Add the airport
    const result = await prisma.airport.create({
      data: portHarcourtAirport,
    });

    console.log("✅ Successfully added Port Harcourt International Airport!");
    console.log("   Details:");
    console.log(`   - Ident: ${result.ident}`);
    console.log(`   - IATA: ${result.iataCode}`);
    console.log(`   - ICAO: ${result.icaoCode}`);
    console.log(`   - Name: ${result.name}`);
    console.log(`   - Type: ${result.type}`);
    console.log(`   - Location: ${result.municipality}, ${result.countryCode}`);
    console.log(`   - Coordinates: ${result.latitude}, ${result.longitude}`);
  } catch (error: any) {
    console.error("❌ Error adding airport:", error.message);
    console.error("Full error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
addPortHarcourtAirport().catch(console.error);

import { PrismaClient, AirportType } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import { parse } from "csv-parse/sync";

const prisma = new PrismaClient();

// Root directory (project root - where airports.csv is located)
const ROOT_DIR = path.join(__dirname, "../../..");

async function seedNigerianSmallAirports() {
  console.log("✈️ Adding Nigerian small airports...\n");

  const csvPath = path.join(ROOT_DIR, "airports.csv");
  const fileContent = fs.readFileSync(csvPath, "utf-8");

  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
  });

  // Get existing airport idents to avoid duplicates
  const existingAirports = await prisma.airport.findMany({
    select: { ident: true },
  });
  const existingIdents = new Set(existingAirports.map((a) => a.ident));
  console.log(`  Found ${existingIdents.size} existing airports in database`);

  // Check if NG country and regions exist
  const ngCountry = await prisma.country.findUnique({ where: { code: "NG" } });
  if (!ngCountry) {
    console.error(
      "❌ Nigeria (NG) not found in countries table. Please seed countries first.",
    );
    return;
  }

  const ngRegions = await prisma.region.findMany({
    where: { code: { startsWith: "NG-" } },
    select: { code: true },
  });
  const regionSet = new Set(ngRegions.map((r) => r.code));
  console.log(`  Found ${regionSet.size} Nigerian regions`);

  // Filter for Nigerian small airports only
  const nigerianSmallAirports: any[] = [];
  let skipped = 0;

  for (const record of records) {
    // Only Nigerian airports (iso_country = "NG")
    if (record.iso_country !== "NG") continue;

    // Only small airports (we want to add these)
    if (record.type !== "small_airport") continue;

    // Skip if already exists
    if (existingIdents.has(record.ident)) {
      console.log(
        `  Skipping ${record.ident} - ${record.name} (already exists)`,
      );
      skipped++;
      continue;
    }

    // Skip if region doesn't exist
    if (!regionSet.has(record.iso_region)) {
      console.log(
        `  Skipping ${record.ident} - region ${record.iso_region} not found`,
      );
      skipped++;
      continue;
    }

    nigerianSmallAirports.push({
      ident: record.ident,
      type: "small_airport" as AirportType,
      name: record.name,
      latitude: parseFloat(record.latitude_deg) || 0,
      longitude: parseFloat(record.longitude_deg) || 0,
      elevationFt: record.elevation_ft ? parseInt(record.elevation_ft) : null,
      continent: record.continent || "AF",
      countryCode: record.iso_country,
      regionCode: record.iso_region,
      municipality: record.municipality || null,
      scheduledService: record.scheduled_service === "yes",
      icaoCode: record.icao_code || null,
      iataCode: record.iata_code || null,
      gpsCode: record.gps_code || null,
      localCode: record.local_code || null,
      homeLink: record.home_link || null,
      wikipediaLink: record.wikipedia_link || null,
      keywords: record.keywords || null,
    });
  }

  console.log(
    `\n  Found ${nigerianSmallAirports.length} Nigerian small airports to add:`,
  );
  for (const airport of nigerianSmallAirports) {
    console.log(
      `    - ${airport.ident}: ${airport.name} (${airport.municipality || "N/A"})`,
    );
  }

  if (nigerianSmallAirports.length === 0) {
    console.log("\n  No new Nigerian small airports to add.");
    return;
  }

  // Insert airports
  console.log("\n  Inserting airports...");
  let count = 0;
  for (const airport of nigerianSmallAirports) {
    try {
      await prisma.airport.create({ data: airport });
      count++;
      console.log(`  ✅ Added: ${airport.name}`);
    } catch (error: any) {
      console.error(`  ❌ Failed to add ${airport.name}:`, error.message);
    }
  }

  const totalNigerian = await prisma.airport.count({
    where: { countryCode: "NG" },
  });

  console.log(
    `\n✅ Added ${count} Nigerian small airports (skipped ${skipped})`,
  );
  console.log(`📊 Total Nigerian airports in database: ${totalNigerian}`);
}

async function main() {
  try {
    await seedNigerianSmallAirports();
  } catch (error) {
    console.error("❌ Error:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();

/**
 * Seed ALL remaining airports from airports.csv
 * This script uploads all airport types that don't already exist in the database
 * - Skips airports that already exist (by ident)
 * - Includes: small_airport, heliport, closed, seaplane_base, balloonport
 * - Already have: large_airport, medium_airport
 */

import { PrismaClient, AirportType } from "@prisma/client";
import { parse } from "csv-parse/sync";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

// Root directory where airports.csv is located
const ROOT_DIR = path.resolve(__dirname, "../../..");

// Map CSV type strings to Prisma AirportType enum
const typeMap: Record<string, AirportType> = {
  large_airport: "large_airport",
  medium_airport: "medium_airport",
  small_airport: "small_airport",
  heliport: "heliport",
  seaplane_base: "seaplane_base",
  closed: "closed",
  balloonport: "balloonport",
};

async function seedAllRemainingAirports() {
  console.log("✈️  Seeding ALL remaining airports...\n");

  // Read CSV
  const csvPath = path.join(ROOT_DIR, "airports.csv");
  console.log(`  Reading: ${csvPath}`);
  const fileContent = fs.readFileSync(csvPath, "utf-8");

  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
  });
  console.log(`  Total records in CSV: ${records.length.toLocaleString()}`);

  // Get existing airport idents to skip duplicates
  console.log("\n  Loading existing airports from database...");
  const existingAirports = await prisma.airport.findMany({
    select: { ident: true },
  });
  const existingIdents = new Set(existingAirports.map((a) => a.ident));
  console.log(
    `  Found ${existingIdents.size.toLocaleString()} existing airports in database`,
  );

  // Load country and region codes
  console.log("  Loading countries and regions...");
  const countries = await prisma.country.findMany({ select: { code: true } });
  const regions = await prisma.region.findMany({ select: { code: true } });
  const countrySet = new Set(countries.map((c) => c.code));
  const regionSet = new Set(regions.map((r) => r.code));
  console.log(
    `  Loaded ${countrySet.size} countries, ${regionSet.size} regions`,
  );

  // Filter to airports that need to be added
  const airportsToAdd: any[] = [];
  let skippedExisting = 0;
  let skippedInvalidType = 0;
  let skippedMissingCountry = 0;
  let skippedMissingRegion = 0;

  console.log("\n  Processing records...");
  for (const record of records) {
    // Skip if already exists
    if (existingIdents.has(record.ident)) {
      skippedExisting++;
      continue;
    }

    // Skip invalid types
    if (!typeMap[record.type]) {
      skippedInvalidType++;
      continue;
    }

    // Skip if country doesn't exist
    if (!countrySet.has(record.iso_country)) {
      skippedMissingCountry++;
      continue;
    }

    // Skip if region doesn't exist
    if (!regionSet.has(record.iso_region)) {
      skippedMissingRegion++;
      continue;
    }

    airportsToAdd.push({
      ident: record.ident,
      type: typeMap[record.type],
      name: record.name,
      latitude: parseFloat(record.latitude_deg) || 0,
      longitude: parseFloat(record.longitude_deg) || 0,
      elevationFt: record.elevation_ft ? parseInt(record.elevation_ft) : null,
      continent: record.continent || "Unknown",
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

  console.log(`\n  📊 Processing summary:`);
  console.log(`     Airports to add: ${airportsToAdd.length.toLocaleString()}`);
  console.log(
    `     Skipped (already exist): ${skippedExisting.toLocaleString()}`,
  );
  console.log(
    `     Skipped (invalid type): ${skippedInvalidType.toLocaleString()}`,
  );
  console.log(
    `     Skipped (missing country): ${skippedMissingCountry.toLocaleString()}`,
  );
  console.log(
    `     Skipped (missing region): ${skippedMissingRegion.toLocaleString()}`,
  );

  if (airportsToAdd.length === 0) {
    console.log("\n  ✅ No new airports to add. Database is up to date!");
    return;
  }

  // Count by type
  const typeCounts: Record<string, number> = {};
  airportsToAdd.forEach((a) => {
    typeCounts[a.type] = (typeCounts[a.type] || 0) + 1;
  });
  console.log(`\n  📋 Airports to add by type:`);
  Object.entries(typeCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      console.log(`     ${type}: ${count.toLocaleString()}`);
    });

  // Insert in batches
  console.log(`\n  🚀 Inserting airports in batches...`);
  const batchSize = 500;
  let insertedCount = 0;
  let errorCount = 0;

  for (let i = 0; i < airportsToAdd.length; i += batchSize) {
    const batch = airportsToAdd.slice(i, i + batchSize);
    const progress = Math.min(i + batchSize, airportsToAdd.length);
    const percent = ((progress / airportsToAdd.length) * 100).toFixed(1);

    try {
      const result = await prisma.airport.createMany({
        data: batch,
        skipDuplicates: true,
      });
      insertedCount += result.count;

      // Progress update every 5000 or at the end
      if (progress % 5000 === 0 || progress === airportsToAdd.length) {
        console.log(
          `     Progress: ${progress.toLocaleString()}/${airportsToAdd.length.toLocaleString()} (${percent}%) - Inserted: ${insertedCount.toLocaleString()}`,
        );
      }
    } catch (error: any) {
      console.error(`     ❌ Batch error at ${i}: ${error.message}`);
      errorCount += batch.length;

      // Try individual inserts for failed batch
      for (const airport of batch) {
        try {
          await prisma.airport.create({ data: airport });
          insertedCount++;
        } catch (err: any) {
          // Skip individual errors silently
        }
      }
    }
  }

  // Final stats
  const totalAirports = await prisma.airport.count();
  const airportsByType = await prisma.airport.groupBy({
    by: ["type"],
    _count: { type: true },
  });

  console.log(`\n  ✅ Seeding complete!`);
  console.log(`     Inserted: ${insertedCount.toLocaleString()} airports`);
  console.log(`     Errors: ${errorCount.toLocaleString()}`);
  console.log(
    `\n  📊 Total airports in database: ${totalAirports.toLocaleString()}`,
  );
  console.log(`\n  📋 Database airports by type:`);
  airportsByType
    .sort((a, b) => b._count.type - a._count.type)
    .forEach((row) => {
      console.log(`     ${row.type}: ${row._count.type.toLocaleString()}`);
    });
}

async function main() {
  console.log("═".repeat(60));
  console.log("  PEXJET - Seed All Remaining Airports");
  console.log("═".repeat(60));

  try {
    await seedAllRemainingAirports();
    console.log("\n" + "═".repeat(60));
    console.log("  ✨ Done!");
    console.log("═".repeat(60));
  } catch (error) {
    console.error("\n❌ Error:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();

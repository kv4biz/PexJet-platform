import { PrismaClient } from "@prisma/client";
import { parse } from "csv-parse/sync";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

const ROOT_DIR = path.resolve(__dirname, "../../..");

async function seedRemainingRegions() {
  console.log("🗺️ Seeding remaining regions...");

  const csvPath = path.join(ROOT_DIR, "regions.csv");
  const fileContent = fs.readFileSync(csvPath, "utf-8");

  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
  });

  // Get existing region codes
  const existingRegions = await prisma.region.findMany({
    select: { code: true },
  });
  const existingCodes = new Set(existingRegions.map((r) => r.code));
  console.log(`  Found ${existingCodes.size} existing regions`);

  // Get country codes
  const countries = await prisma.country.findMany({ select: { code: true } });
  const countrySet = new Set(countries.map((c) => c.code));

  // Filter to only new regions
  const newRegions: any[] = [];
  for (const record of records) {
    if (existingCodes.has(record.code)) continue;
    if (!countrySet.has(record.iso_country)) continue;

    newRegions.push({
      code: record.code,
      localCode: record.local_code || "",
      name: record.name,
      continent: record.continent || "Unknown",
      countryCode: record.iso_country,
      wikipediaLink: record.wikipedia_link || null,
      keywords: record.keywords || null,
    });
  }

  console.log(`  Found ${newRegions.length} new regions to insert`);

  // Batch insert
  const batchSize = 100;
  let count = 0;
  for (let i = 0; i < newRegions.length; i += batchSize) {
    const batch = newRegions.slice(i, i + batchSize);
    try {
      await prisma.region.createMany({
        data: batch,
        skipDuplicates: true,
      });
      count += batch.length;
      if (count % 500 === 0 || i + batchSize >= newRegions.length) {
        console.log(`  Processed ${count} regions...`);
      }
    } catch (e) {
      console.error(`  Batch error at ${i}, trying individual inserts...`);
      for (const region of batch) {
        try {
          await prisma.region.upsert({
            where: { code: region.code },
            update: {},
            create: region,
          });
          count++;
        } catch (err) {
          // Skip
        }
      }
    }
  }

  const totalRegions = await prisma.region.count();
  console.log(`✅ Seeded regions. Total: ${totalRegions}`);
}

async function seedAirports() {
  console.log("✈️ Seeding airports...");

  const csvPath = path.join(ROOT_DIR, "airports.csv");
  const fileContent = fs.readFileSync(csvPath, "utf-8");

  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
  });

  // Get existing airport idents
  const existingAirports = await prisma.airport.findMany({
    select: { ident: true },
  });
  const existingIdents = new Set(existingAirports.map((a) => a.ident));
  console.log(`  Found ${existingIdents.size} existing airports`);

  // Cache country and region codes
  const countries = await prisma.country.findMany({ select: { code: true } });
  const regions = await prisma.region.findMany({ select: { code: true } });
  const countrySet = new Set(countries.map((c) => c.code));
  const regionSet = new Set(regions.map((r) => r.code));
  console.log(
    `  Loaded ${countrySet.size} countries, ${regionSet.size} regions`,
  );

  // Valid airport types (only large and medium airports)
  const validTypes = ["large_airport", "medium_airport"];

  // Filter and prepare valid airports
  const validAirports: any[] = [];
  let skipped = 0;
  for (const record of records) {
    if (existingIdents.has(record.ident)) {
      skipped++;
      continue;
    }
    if (!validTypes.includes(record.type)) {
      skipped++;
      continue;
    }
    if (
      !countrySet.has(record.iso_country) ||
      !regionSet.has(record.iso_region)
    ) {
      skipped++;
      continue;
    }

    validAirports.push({
      ident: record.ident,
      type: record.type as any,
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

  console.log(`  Found ${validAirports.length} valid airports to insert`);

  // Batch insert
  const batchSize = 100;
  let count = 0;
  for (let i = 0; i < validAirports.length; i += batchSize) {
    const batch = validAirports.slice(i, i + batchSize);
    try {
      await prisma.airport.createMany({
        data: batch,
        skipDuplicates: true,
      });
      count += batch.length;
      if (count % 500 === 0 || i + batchSize >= validAirports.length) {
        console.log(`  Processed ${count} airports...`);
      }
    } catch (e) {
      console.error(`  Batch error at ${i}, trying individual inserts...`);
      for (const airport of batch) {
        try {
          await prisma.airport.upsert({
            where: { ident: airport.ident },
            update: {},
            create: airport,
          });
          count++;
        } catch (err) {
          // Skip
        }
      }
    }
  }

  const totalAirports = await prisma.airport.count();
  console.log(
    `✅ Seeded airports. Total: ${totalAirports} (skipped ${skipped})`,
  );
}

async function main() {
  console.log("🚀 Continuing database seed...\n");

  try {
    await seedRemainingRegions();
    await seedAirports();
    console.log("\n✨ Seed continuation completed!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    throw error;
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

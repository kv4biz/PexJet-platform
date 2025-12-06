import { PrismaClient, AircraftCategory, AircraftAvailability, AdminRole } from "@prisma/client";
import { parse } from "csv-parse/sync";
import * as fs from "fs";
import * as path from "path";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Path to CSV files (in root of project)
const ROOT_DIR = path.resolve(__dirname, "../../..");

async function seedCountries() {
  console.log("🌍 Seeding countries...");
  
  const csvPath = path.join(ROOT_DIR, "countries.csv");
  const fileContent = fs.readFileSync(csvPath, "utf-8");
  
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
  });
  
  let count = 0;
  for (const record of records) {
    await prisma.country.upsert({
      where: { code: record.code },
      update: {},
      create: {
        code: record.code,
        name: record.name,
        continent: record.continent || "Unknown",
        wikipediaLink: record.wikipedia_link || null,
        keywords: record.keywords || null,
      },
    });
    count++;
  }
  
  console.log(`✅ Seeded ${count} countries`);
}

async function seedRegions() {
  console.log("🗺️ Seeding regions...");
  
  const csvPath = path.join(ROOT_DIR, "regions.csv");
  const fileContent = fs.readFileSync(csvPath, "utf-8");
  
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
  });
  
  let count = 0;
  let skipped = 0;
  
  for (const record of records) {
    // Check if country exists
    const countryExists = await prisma.country.findUnique({
      where: { code: record.iso_country },
    });
    
    if (!countryExists) {
      skipped++;
      continue;
    }
    
    await prisma.region.upsert({
      where: { code: record.code },
      update: {},
      create: {
        code: record.code,
        localCode: record.local_code || "",
        name: record.name,
        continent: record.continent || "Unknown",
        countryCode: record.iso_country,
        wikipediaLink: record.wikipedia_link || null,
        keywords: record.keywords || null,
      },
    });
    count++;
  }
  
  console.log(`✅ Seeded ${count} regions (skipped ${skipped} due to missing countries)`);
}

async function seedAirports() {
  console.log("✈️ Seeding airports...");
  
  const csvPath = path.join(ROOT_DIR, "airports.csv");
  const fileContent = fs.readFileSync(csvPath, "utf-8");
  
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
  });
  
  // Cache country and region codes upfront (single query each)
  console.log("  Loading country and region codes...");
  const countries = await prisma.country.findMany({ select: { code: true } });
  const regions = await prisma.region.findMany({ select: { code: true } });
  const countrySet = new Set(countries.map(c => c.code));
  const regionSet = new Set(regions.map(r => r.code));
  console.log(`  Loaded ${countrySet.size} countries, ${regionSet.size} regions`);
  
  let count = 0;
  let skipped = 0;
  
  // Valid airport types (only large and medium airports)
  const validTypes = [
    "large_airport",
    "medium_airport",
  ];
  
  // Filter and prepare all valid airports first
  const validAirports: any[] = [];
  for (const record of records) {
    // Skip invalid airport types first (fast check)
    if (!validTypes.includes(record.type)) {
      skipped++;
      continue;
    }
    
    // Skip if country or region doesn't exist (using cached sets)
    if (!countrySet.has(record.iso_country) || !regionSet.has(record.iso_region)) {
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
  
  // Insert in batches using createMany (much faster than individual upserts)
  const batchSize = 100;
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
      // If batch fails, try individual inserts
      for (const airport of batch) {
        try {
          await prisma.airport.upsert({
            where: { ident: airport.ident },
            update: {},
            create: airport,
          });
          count++;
        } catch (err) {
          skipped++;
        }
      }
    }
  }
  
  console.log(`✅ Seeded ${count} airports (skipped ${skipped})`);
}

async function seedAircraft() {
  console.log("🛩️ Seeding sample aircraft...");
  
  const aircraft = [
    // Light Jets
    {
      name: "Citation CJ3+",
      manufacturer: "Cessna",
      model: "CJ3+",
      category: AircraftCategory.LIGHT_JET,
      availability: AircraftAvailability.BOTH,
      passengerCapacityMin: 6,
      passengerCapacityMax: 9,
      rangeNm: 2040,
      cruiseSpeedKnots: 416,
      baggageCapacityCuFt: 66,
      cabinLengthFt: 15.7,
      cabinWidthFt: 4.8,
      cabinHeightFt: 4.7,
      lengthFt: 51.2,
      wingspanFt: 53.3,
      heightFt: 15.2,
      yearOfManufacture: 2014,
      hourlyRateUsd: 3500,
      description: "The Citation CJ3+ offers exceptional performance and comfort for light jet travel.",
    },
    {
      name: "Phenom 300E",
      manufacturer: "Embraer",
      model: "Phenom 300E",
      category: AircraftCategory.LIGHT_JET,
      availability: AircraftAvailability.BOTH,
      passengerCapacityMin: 6,
      passengerCapacityMax: 10,
      rangeNm: 2010,
      cruiseSpeedKnots: 453,
      baggageCapacityCuFt: 84,
      cabinLengthFt: 17.2,
      cabinWidthFt: 5.1,
      cabinHeightFt: 4.9,
      lengthFt: 51.9,
      wingspanFt: 52.2,
      heightFt: 16.7,
      yearOfManufacture: 2020,
      hourlyRateUsd: 3800,
      description: "Best-selling light jet with class-leading performance and cabin comfort.",
    },
    // Midsize Jets
    {
      name: "Citation XLS+",
      manufacturer: "Cessna",
      model: "XLS+",
      category: AircraftCategory.MIDSIZE_JET,
      availability: AircraftAvailability.BOTH,
      passengerCapacityMin: 8,
      passengerCapacityMax: 12,
      rangeNm: 2100,
      cruiseSpeedKnots: 441,
      baggageCapacityCuFt: 90,
      cabinLengthFt: 18.5,
      cabinWidthFt: 5.5,
      cabinHeightFt: 5.7,
      lengthFt: 52.5,
      wingspanFt: 56.3,
      heightFt: 17.2,
      yearOfManufacture: 2018,
      hourlyRateUsd: 4500,
      description: "Versatile midsize jet perfect for business and leisure travel.",
    },
    {
      name: "Hawker 900XP",
      manufacturer: "Hawker Beechcraft",
      model: "900XP",
      category: AircraftCategory.MIDSIZE_JET,
      availability: AircraftAvailability.LOCAL,
      passengerCapacityMin: 8,
      passengerCapacityMax: 9,
      rangeNm: 2930,
      cruiseSpeedKnots: 466,
      baggageCapacityCuFt: 49,
      cabinLengthFt: 21.3,
      cabinWidthFt: 6.0,
      cabinHeightFt: 5.8,
      lengthFt: 48.4,
      wingspanFt: 54.3,
      heightFt: 17.7,
      yearOfManufacture: 2012,
      hourlyRateUsd: 4200,
      description: "Reliable midsize jet with excellent range and cabin space.",
    },
    // Super Midsize Jets
    {
      name: "Citation Longitude",
      manufacturer: "Cessna",
      model: "Longitude",
      category: AircraftCategory.SUPER_MIDSIZE_JET,
      availability: AircraftAvailability.BOTH,
      passengerCapacityMin: 8,
      passengerCapacityMax: 12,
      rangeNm: 3500,
      cruiseSpeedKnots: 476,
      baggageCapacityCuFt: 112,
      cabinLengthFt: 25.0,
      cabinWidthFt: 6.0,
      cabinHeightFt: 6.0,
      lengthFt: 73.2,
      wingspanFt: 68.9,
      heightFt: 19.6,
      yearOfManufacture: 2021,
      hourlyRateUsd: 5500,
      description: "The quietest cabin in its class with exceptional range.",
    },
    {
      name: "Challenger 350",
      manufacturer: "Bombardier",
      model: "Challenger 350",
      category: AircraftCategory.SUPER_MIDSIZE_JET,
      availability: AircraftAvailability.INTERNATIONAL,
      passengerCapacityMin: 8,
      passengerCapacityMax: 10,
      rangeNm: 3200,
      cruiseSpeedKnots: 470,
      baggageCapacityCuFt: 106,
      cabinLengthFt: 25.2,
      cabinWidthFt: 7.2,
      cabinHeightFt: 6.1,
      lengthFt: 68.7,
      wingspanFt: 69.0,
      heightFt: 20.0,
      yearOfManufacture: 2019,
      hourlyRateUsd: 5800,
      description: "Industry-leading super midsize jet with widest cabin in class.",
    },
    // Heavy Jets
    {
      name: "Gulfstream G450",
      manufacturer: "Gulfstream",
      model: "G450",
      category: AircraftCategory.HEAVY_JET,
      availability: AircraftAvailability.BOTH,
      passengerCapacityMin: 12,
      passengerCapacityMax: 16,
      rangeNm: 4350,
      cruiseSpeedKnots: 476,
      baggageCapacityCuFt: 169,
      cabinLengthFt: 45.1,
      cabinWidthFt: 7.3,
      cabinHeightFt: 6.2,
      lengthFt: 89.3,
      wingspanFt: 77.8,
      heightFt: 25.8,
      yearOfManufacture: 2016,
      hourlyRateUsd: 8500,
      description: "Exceptional heavy jet combining range, speed, and luxury.",
    },
    {
      name: "Falcon 900LX",
      manufacturer: "Dassault",
      model: "Falcon 900LX",
      category: AircraftCategory.HEAVY_JET,
      availability: AircraftAvailability.INTERNATIONAL,
      passengerCapacityMin: 12,
      passengerCapacityMax: 14,
      rangeNm: 4750,
      cruiseSpeedKnots: 481,
      baggageCapacityCuFt: 127,
      cabinLengthFt: 33.2,
      cabinWidthFt: 7.7,
      cabinHeightFt: 6.2,
      lengthFt: 66.3,
      wingspanFt: 70.2,
      heightFt: 24.9,
      yearOfManufacture: 2017,
      hourlyRateUsd: 7800,
      description: "Tri-engine heavy jet with outstanding short-field performance.",
    },
    // Ultra Long Range
    {
      name: "Gulfstream G650ER",
      manufacturer: "Gulfstream",
      model: "G650ER",
      category: AircraftCategory.ULTRA_LONG_RANGE,
      availability: AircraftAvailability.INTERNATIONAL,
      passengerCapacityMin: 13,
      passengerCapacityMax: 19,
      rangeNm: 7500,
      cruiseSpeedKnots: 516,
      baggageCapacityCuFt: 195,
      cabinLengthFt: 46.8,
      cabinWidthFt: 8.5,
      cabinHeightFt: 6.4,
      lengthFt: 99.8,
      wingspanFt: 99.6,
      heightFt: 25.8,
      yearOfManufacture: 2020,
      hourlyRateUsd: 12000,
      description: "Flagship ultra-long-range jet capable of connecting any two cities.",
    },
    {
      name: "Global 7500",
      manufacturer: "Bombardier",
      model: "Global 7500",
      category: AircraftCategory.ULTRA_LONG_RANGE,
      availability: AircraftAvailability.INTERNATIONAL,
      passengerCapacityMin: 14,
      passengerCapacityMax: 19,
      rangeNm: 7700,
      cruiseSpeedKnots: 516,
      baggageCapacityCuFt: 195,
      cabinLengthFt: 54.4,
      cabinWidthFt: 8.0,
      cabinHeightFt: 6.2,
      lengthFt: 111.0,
      wingspanFt: 104.0,
      heightFt: 27.4,
      yearOfManufacture: 2021,
      hourlyRateUsd: 13000,
      description: "Largest and longest-range purpose-built business jet.",
    },
    // Turboprops
    {
      name: "King Air 350i",
      manufacturer: "Beechcraft",
      model: "King Air 350i",
      category: AircraftCategory.TURBOPROP,
      availability: AircraftAvailability.LOCAL,
      passengerCapacityMin: 8,
      passengerCapacityMax: 11,
      rangeNm: 1806,
      cruiseSpeedKnots: 312,
      baggageCapacityCuFt: 71,
      cabinLengthFt: 19.2,
      cabinWidthFt: 4.5,
      cabinHeightFt: 4.8,
      lengthFt: 46.7,
      wingspanFt: 57.9,
      heightFt: 14.3,
      yearOfManufacture: 2018,
      hourlyRateUsd: 2200,
      description: "Most popular turboprop for business aviation.",
    },
    {
      name: "Pilatus PC-12 NGX",
      manufacturer: "Pilatus",
      model: "PC-12 NGX",
      category: AircraftCategory.TURBOPROP,
      availability: AircraftAvailability.BOTH,
      passengerCapacityMin: 6,
      passengerCapacityMax: 9,
      rangeNm: 1803,
      cruiseSpeedKnots: 285,
      baggageCapacityCuFt: 40,
      cabinLengthFt: 16.9,
      cabinWidthFt: 5.0,
      cabinHeightFt: 4.8,
      lengthFt: 47.3,
      wingspanFt: 53.3,
      heightFt: 14.0,
      yearOfManufacture: 2020,
      hourlyRateUsd: 1800,
      description: "Versatile single-engine turboprop with jet-like cabin.",
    },
  ];
  
  for (const a of aircraft) {
    await prisma.aircraft.upsert({
      where: { 
        id: a.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
      },
      update: {},
      create: {
        id: a.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
        ...a,
      },
    });
  }
  
  console.log(`✅ Seeded ${aircraft.length} aircraft`);
}

async function seedTestAdmin() {
  console.log("👤 Creating test admin user...");
  
  const passwordHash = await bcrypt.hash("pass1234word9", 12);
  
  await prisma.admin.upsert({
    where: { email: "ademola@pexjet.com" },
    update: {},
    create: {
      email: "ademola@pexjet.com",
      username: "ademola",
      passwordHash,
      fullName: "Ademola Admin",
      phone: "+2348000000000", // Update with real number
      role: AdminRole.SUPER_ADMIN,
      address: "Lagos, Nigeria",
    },
  });
  
  console.log("✅ Created test admin: ademola@pexjet.com");
}

async function seedSettings() {
  console.log("⚙️ Seeding default settings...");
  
  await prisma.settings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      paymentWindowHours: 3,
      dealDeadlineMinutes: 30,
      minimumBookingNoticeHours: 24,
      defaultOperatorCommission: 10,
      supportEmail: "support@pexjet.com",
      supportPhone: "+2348000000000",
    },
  });
  
  console.log("✅ Seeded default settings");
}

async function main() {
  console.log("🚀 Starting database seed...\n");
  
  try {
    // Check if countries already seeded
    const countryCount = await prisma.country.count();
    if (countryCount === 0) {
      await seedCountries();
    } else {
      console.log(`⏭️ Skipping countries (${countryCount} already exist)`);
    }
    
    // Check if regions already seeded
    const regionCount = await prisma.region.count();
    if (regionCount === 0) {
      await seedRegions();
    } else {
      console.log(`⏭️ Skipping regions (${regionCount} already exist)`);
    }
    
    // Check if airports already seeded
    const airportCount = await prisma.airport.count();
    if (airportCount === 0) {
      await seedAirports();
    } else {
      console.log(`⏭️ Skipping airports (${airportCount} already exist)`);
    }
    
    // Check if aircraft already seeded
    const aircraftCount = await prisma.aircraft.count();
    if (aircraftCount === 0) {
      await seedAircraft();
    } else {
      console.log(`⏭️ Skipping aircraft (${aircraftCount} already exist)`);
    }
    
    await seedTestAdmin();
    await seedSettings();
    
    console.log("\n✨ Database seeding completed successfully!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

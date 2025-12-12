import {
  PrismaClient,
  AircraftCategory,
  AircraftAvailability,
  AdminRole,
} from "@prisma/client";
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

  console.log(
    `✅ Seeded ${count} regions (skipped ${skipped} due to missing countries)`,
  );
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
  const countrySet = new Set(countries.map((c) => c.code));
  const regionSet = new Set(regions.map((r) => r.code));
  console.log(
    `  Loaded ${countrySet.size} countries, ${regionSet.size} regions`,
  );

  let count = 0;
  let skipped = 0;

  // Valid airport types (only large and medium airports)
  const validTypes = ["large_airport", "medium_airport"];

  // Filter and prepare all valid airports first
  const validAirports: any[] = [];
  for (const record of records) {
    // Skip invalid airport types first (fast check)
    if (!validTypes.includes(record.type)) {
      skipped++;
      continue;
    }

    // Skip if country or region doesn't exist (using cached sets)
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
    // Light Jet
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
      fuelCapacityGal: 578,
      cabinLengthFt: 17.2,
      cabinWidthFt: 5.1,
      cabinHeightFt: 4.9,
      lengthFt: 51.9,
      wingspanFt: 52.2,
      heightFt: 16.7,
      yearOfManufacture: 2020,
      hourlyRateUsd: 3800,
      description:
        "Best-selling light jet with class-leading performance and cabin comfort.",
    },
    // Super Midsize Jet
    {
      name: "Challenger 350",
      manufacturer: "Bombardier",
      model: "Challenger 350",
      category: AircraftCategory.SUPER_MIDSIZE_JET,
      availability: AircraftAvailability.BOTH,
      passengerCapacityMin: 8,
      passengerCapacityMax: 10,
      rangeNm: 3200,
      cruiseSpeedKnots: 470,
      baggageCapacityCuFt: 106,
      fuelCapacityGal: 1352,
      cabinLengthFt: 25.2,
      cabinWidthFt: 7.2,
      cabinHeightFt: 6.1,
      lengthFt: 68.7,
      wingspanFt: 69.0,
      heightFt: 20.0,
      yearOfManufacture: 2019,
      hourlyRateUsd: 5800,
      description:
        "Industry-leading super midsize jet with widest cabin in class.",
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
      fuelCapacityGal: 4850,
      cabinLengthFt: 46.8,
      cabinWidthFt: 8.5,
      cabinHeightFt: 6.4,
      lengthFt: 99.8,
      wingspanFt: 99.6,
      heightFt: 25.8,
      yearOfManufacture: 2020,
      hourlyRateUsd: 12000,
      description:
        "Flagship ultra-long-range jet capable of connecting any two cities.",
    },
  ];

  for (const a of aircraft) {
    await prisma.aircraft.upsert({
      where: {
        id: a.name
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, ""),
      },
      update: {},
      create: {
        id: a.name
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, ""),
        ...a,
      },
    });
  }

  console.log(`✅ Seeded ${aircraft.length} aircraft`);
}

async function seedSuperAdmin() {
  console.log("👤 Creating super admin user...");

  const passwordHash = await bcrypt.hash("D@v!d2O11", 12);

  await prisma.admin.upsert({
    where: { email: "ademola@pexjet.com" },
    update: {},
    create: {
      email: "ademola@pexjet.com",
      username: "Mr Ademola",
      passwordHash,
      fullName: "Mr Ademola",
      phone: "+2349130912078",
      role: AdminRole.SUPER_ADMIN,
      address: "Lagos, Nigeria",
    },
  });

  console.log("✅ Created super admin: ademola@pexjet.com");
}

async function seedDocumentTemplates() {
  console.log("📄 Seeding document templates...");

  const templates = [
    {
      name: "charter_quote_invoice",
      content: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    .header { text-align: center; margin-bottom: 30px; }
    .logo { font-size: 24px; font-weight: bold; color: #D4AF37; }
    .section { margin-bottom: 20px; }
    .section-title { font-weight: bold; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 10px; }
    .row { display: flex; justify-content: space-between; margin-bottom: 5px; }
    .total { font-size: 18px; font-weight: bold; margin-top: 20px; }
    .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">PEXJET</div>
    <p>Charter Quote & Invoice</p>
    <p>Reference: {{referenceNumber}}</p>
  </div>
  <div class="section">
    <div class="section-title">Client Information</div>
    <div class="row"><span>Name:</span><span>{{clientName}}</span></div>
    <div class="row"><span>Email:</span><span>{{clientEmail}}</span></div>
    <div class="row"><span>Phone:</span><span>{{clientPhone}}</span></div>
  </div>
  <div class="section">
    <div class="section-title">Flight Details</div>
    {{flightDetails}}
  </div>
  <div class="section">
    <div class="section-title">Payment</div>
    <div class="total">Total: \${{totalPrice}} USD</div>
    {{paymentInstructions}}
  </div>
  <div class="footer">
    <p>Thank you for choosing PexJet</p>
    <p>{{companyAddress}} | {{companyPhone}} | {{companyEmail}}</p>
  </div>
</body>
</html>`,
    },
    {
      name: "empty_leg_quote_invoice",
      content: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    .header { text-align: center; margin-bottom: 30px; }
    .logo { font-size: 24px; font-weight: bold; color: #D4AF37; }
    .section { margin-bottom: 20px; }
    .section-title { font-weight: bold; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 10px; }
    .row { display: flex; justify-content: space-between; margin-bottom: 5px; }
    .total { font-size: 18px; font-weight: bold; margin-top: 20px; }
    .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">PEXJET</div>
    <p>Empty Leg Quote & Invoice</p>
    <p>Reference: {{referenceNumber}}</p>
  </div>
  <div class="section">
    <div class="section-title">Client Information</div>
    <div class="row"><span>Name:</span><span>{{clientName}}</span></div>
    <div class="row"><span>Email:</span><span>{{clientEmail}}</span></div>
    <div class="row"><span>Phone:</span><span>{{clientPhone}}</span></div>
  </div>
  <div class="section">
    <div class="section-title">Flight Details</div>
    <div class="row"><span>Route:</span><span>{{departure}} → {{arrival}}</span></div>
    <div class="row"><span>Date:</span><span>{{departureDate}}</span></div>
    <div class="row"><span>Aircraft:</span><span>{{aircraftName}}</span></div>
    <div class="row"><span>Seats:</span><span>{{seatsRequested}}</span></div>
  </div>
  <div class="section">
    <div class="section-title">Payment</div>
    <div class="total">Total: \${{totalPrice}} USD</div>
    {{paymentInstructions}}
  </div>
  <div class="footer">
    <p>Thank you for choosing PexJet</p>
    <p>{{companyAddress}} | {{companyPhone}} | {{companyEmail}}</p>
  </div>
</body>
</html>`,
    },
    {
      name: "payment_receipt",
      content: `<!DOCTYPE html> 
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    .header { text-align: center; margin-bottom: 30px; }
    .logo { font-size: 24px; font-weight: bold; color: #D4AF37; }
    .receipt-badge { background: #4CAF50; color: white; padding: 5px 15px; display: inline-block; margin: 10px 0; }
    .section { margin-bottom: 20px; }
    .section-title { font-weight: bold; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 10px; }
    .row { display: flex; justify-content: space-between; margin-bottom: 5px; }
    .total { font-size: 18px; font-weight: bold; }
    .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">PEXJET</div>
    <div class="receipt-badge">PAYMENT RECEIVED</div>
    <p>Receipt: {{receiptNumber}}</p>
    <p>Date: {{paymentDate}}</p>
  </div>
  <div class="section">
    <div class="section-title">Payment Details</div>
    <div class="row"><span>Reference:</span><span>{{bookingReference}}</span></div>
    <div class="row"><span>Client:</span><span>{{clientName}}</span></div>
    <div class="row"><span>Method:</span><span>{{paymentMethod}}</span></div>
    <div class="row total"><span>Amount Paid:</span><span>\${{amount}} USD</span></div>
  </div>
  <div class="footer">
    <p>Thank you for your payment</p>
    <p>{{companyAddress}} | {{companyPhone}} | {{companyEmail}}</p>
  </div>
</body>
</html>`,
    },
    {
      name: "flight_confirmation",
      content: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    .header { text-align: center; margin-bottom: 30px; }
    .logo { font-size: 24px; font-weight: bold; color: #D4AF37; }
    .confirmed-badge { background: #D4AF37; color: white; padding: 5px 15px; display: inline-block; margin: 10px 0; }
    .section { margin-bottom: 20px; }
    .section-title { font-weight: bold; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 10px; }
    .row { display: flex; justify-content: space-between; margin-bottom: 5px; }
    .important { background: #f5f5f5; padding: 15px; margin: 20px 0; }
    .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">PEXJET</div>
    <div class="confirmed-badge">FLIGHT CONFIRMED</div>
    <p>Confirmation: {{confirmationNumber}}</p>
  </div>
  <div class="section">
    <div class="section-title">Passenger Information</div>
    <div class="row"><span>Name:</span><span>{{clientName}}</span></div>
    <div class="row"><span>Ticket Number:</span><span>{{ticketNumber}}</span></div>
  </div>
  <div class="section">
    <div class="section-title">Flight Details</div>
    {{flightDetails}}
  </div>
  <div class="important">
    <div class="section-title">Important Information</div>
    <div class="row"><span>Check-in Time:</span><span>{{checkInTime}}</span></div>
    <div class="row"><span>Terminal:</span><span>{{terminalInfo}}</span></div>
    <div class="row"><span>Gate:</span><span>{{gateInfo}}</span></div>
    <p><strong>Boarding Instructions:</strong> {{boardingInfo}}</p>
    <p><strong>Pilot:</strong> {{pilotName}} ({{pilotContact}})</p>
  </div>
  <div class="footer">
    <p>Have a safe flight!</p>
    <p>{{companyAddress}} | {{companyPhone}} | {{companyEmail}}</p>
    <p style="margin-top: 20px;"><a href="{{subscribeLink}}">Subscribe for Empty Leg Deals</a></p>
  </div>
</body>
</html>`,
    },
  ];

  for (const template of templates) {
    await prisma.documentTemplate.upsert({
      where: { name: template.name },
      update: { content: template.content },
      create: template,
    });
  }

  console.log(`✅ Seeded ${templates.length} document templates`);
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

    await seedSuperAdmin();
    await seedSettings();
    await seedDocumentTemplates();

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

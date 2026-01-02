import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Price mapping based on aircraft category
const categoryPrices: Record<string, number> = {
  LIGHT: 4000,
  MIDSIZE: 4500,
  SUPER_MIDSIZE: 6500,
  ULTRA_LONG_RANGE: 6500,
  HEAVY: 6500,
};

interface AircraftData {
  id: string;
  name: string;
  manufacturer: string;
  category: string;
  availability: string;
  cabinLengthFt: number;
  cabinWidthFt: number;
  cabinHeightFt: number;
  createdAt: string;
  updatedAt: string;
  baggageCuFt: number;
  exteriorHeightFt: number;
  exteriorLengthFt: number;
  exteriorWingspanFt: number;
  image: string;
  maxPax: number;
  minPax: number;
  cruiseSpeedKnots: number;
  fuelCapacityGal: number;
  rangeNm: number;
  basePricePerHour: number;
}

async function uploadAircraftData() {
  try {
    console.log("Starting aircraft data upload...");

    // Read CSV file
    const csvPath = path.join(process.cwd(), "..", "..", "Aircraft.csv");
    const csvContent = fs.readFileSync(csvPath, "utf-8");

    // Parse CSV
    const lines = csvContent.split("\n");
    const headers = lines[0].split(",").map((h) => h.replace(/"/g, ""));

    const aircraftData: AircraftData[] = [];

    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === "") continue;

      const values = lines[i].split(",").map((v) => v.replace(/"/g, ""));
      const aircraft: any = {};

      headers.forEach((header, index) => {
        aircraft[header] = values[index];
      });

      aircraftData.push(aircraft as AircraftData);
    }

    console.log(`Found ${aircraftData.length} aircraft in CSV`);

    // Clear existing aircraft data
    console.log("Clearing existing aircraft data...");
    await prisma.aircraft.deleteMany();

    // Upload aircraft with updated prices
    console.log("Uploading aircraft with updated prices...");

    for (const aircraft of aircraftData) {
      const newPrice = categoryPrices[aircraft.category];

      if (!newPrice) {
        console.warn(
          `Unknown category: ${aircraft.category} for aircraft: ${aircraft.name}`,
        );
        continue;
      }

      await prisma.aircraft.create({
        data: {
          id: aircraft.id,
          name: aircraft.name,
          manufacturer: aircraft.manufacturer,
          category: aircraft.category as any,
          availability: aircraft.availability as any,
          basePricePerHour: newPrice, // Use updated price
          cabinLengthFt: parseFloat(aircraft.cabinLengthFt.toString()) || null,
          cabinWidthFt: parseFloat(aircraft.cabinWidthFt.toString()) || null,
          cabinHeightFt: parseFloat(aircraft.cabinHeightFt.toString()) || null,
          baggageCuFt: parseFloat(aircraft.baggageCuFt.toString()) || null,
          exteriorHeightFt:
            parseFloat(aircraft.exteriorHeightFt.toString()) || null,
          exteriorLengthFt:
            parseFloat(aircraft.exteriorLengthFt.toString()) || null,
          exteriorWingspanFt:
            parseFloat(aircraft.exteriorWingspanFt.toString()) || null,
          image: aircraft.image || null,
          maxPax: parseInt(aircraft.maxPax.toString()) || null,
          minPax: parseInt(aircraft.minPax.toString()) || null,
          cruiseSpeedKnots:
            parseFloat(aircraft.cruiseSpeedKnots.toString()) || null,
          fuelCapacityGal:
            parseFloat(aircraft.fuelCapacityGal.toString()) || null,
          rangeNm: parseFloat(aircraft.rangeNm.toString()) || null,
        },
      });

      console.log(
        `✓ Uploaded: ${aircraft.name} (${aircraft.category}) - $${newPrice}/hour`,
      );
    }

    console.log("✅ Aircraft data upload completed successfully!");

    // Summary
    const summary = await prisma.aircraft.groupBy({
      by: ["category"],
      _count: { category: true },
      _avg: { basePricePerHour: true },
    });

    console.log("\n📊 Upload Summary:");
    summary.forEach((item) => {
      console.log(
        `  ${item.category}: ${item._count.category} aircraft, avg price: $${item._avg.basePricePerHour}/hour`,
      );
    });
  } catch (error) {
    console.error("❌ Error uploading aircraft data:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
uploadAircraftData()
  .then(() => {
    console.log("Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });

export { uploadAircraftData };

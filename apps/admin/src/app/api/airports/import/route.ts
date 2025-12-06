import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pexjet/database";
import { verifyAccessToken, extractTokenFromHeader, isSuperAdmin } from "@pexjet/lib";
import { parse } from "csv-parse/sync";
import * as fs from "fs";
import * as path from "path";

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const token = extractTokenFromHeader(request.headers.get("authorization"));
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyAccessToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Only super admin can import
    if (!isSuperAdmin(payload.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Read CSV file
    const csvPath = path.join(process.cwd(), "..", "..", "airports.csv");
    
    if (!fs.existsSync(csvPath)) {
      return NextResponse.json(
        { error: "airports.csv file not found" },
        { status: 404 }
      );
    }

    const csvContent = fs.readFileSync(csvPath, "utf-8");
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
    });

    // Filter and transform records - need countries and regions first
    const airportTypes = ["large_airport", "medium_airport", "small_airport", "heliport", "seaplane_base"];
    const validRecords = records.filter(
      (record: any) =>
        airportTypes.includes(record.type) &&
        record.ident &&
        record.name &&
        record.latitude_deg &&
        record.longitude_deg &&
        record.iso_country &&
        record.iso_region
    );

    // Get existing countries and regions
    const countries = await prisma.country.findMany({ select: { code: true } });
    const regions = await prisma.region.findMany({ select: { code: true } });
    const countrySet = new Set(countries.map((c: { code: string }) => c.code));
    const regionSet = new Set(regions.map((r: { code: string }) => r.code));

    // Filter records that have valid country and region
    const filteredRecords = validRecords.filter((record: any) => 
      countrySet.has(record.iso_country) && regionSet.has(record.iso_region)
    );

    // Batch upsert airports
    let importedCount = 0;
    const batchSize = 100;

    for (let i = 0; i < filteredRecords.length; i += batchSize) {
      const batch = filteredRecords.slice(i, i + batchSize);
      
      for (const record of batch) {
        try {
          await prisma.airport.upsert({
            where: { ident: record.ident },
            update: {
              name: record.name,
              type: record.type,
              latitude: parseFloat(record.latitude_deg),
              longitude: parseFloat(record.longitude_deg),
              elevationFt: record.elevation_ft ? parseInt(record.elevation_ft) : null,
              continent: record.continent || "Unknown",
              municipality: record.municipality || null,
              scheduledService: record.scheduled_service === "yes",
              icaoCode: record.icao_code || null,
              iataCode: record.iata_code || null,
              gpsCode: record.gps_code || null,
              localCode: record.local_code || null,
              homeLink: record.home_link || null,
              wikipediaLink: record.wikipedia_link || null,
            },
            create: {
              ident: record.ident,
              name: record.name,
              type: record.type,
              latitude: parseFloat(record.latitude_deg),
              longitude: parseFloat(record.longitude_deg),
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
            },
          });
          importedCount++;
        } catch (e) {
          // Skip failed records
        }
      }
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "AIRPORT_IMPORT",
        targetType: "Airport",
        targetId: "bulk",
        adminId: payload.sub,
        description: `Imported ${importedCount} airports`,
        metadata: { count: importedCount },
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      },
    });

    return NextResponse.json({
      message: "Airports imported successfully",
      count: importedCount,
    });
  } catch (error: any) {
    console.error("Airport import error:", error);
    return NextResponse.json(
      { error: "Failed to import airports: " + error.message },
      { status: 500 }
    );
  }
}

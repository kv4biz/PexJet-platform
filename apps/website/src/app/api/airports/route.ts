import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pexjet/database";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const limit = parseInt(searchParams.get("limit") || "20");

    const whereClause = query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" as const } },
            { municipality: { contains: query, mode: "insensitive" as const } },
            { iataCode: { contains: query, mode: "insensitive" as const } },
            { icaoCode: { contains: query, mode: "insensitive" as const } },
            {
              country: {
                name: { contains: query, mode: "insensitive" as const },
              },
            },
            {
              country: {
                code: { contains: query, mode: "insensitive" as const },
              },
            },
            {
              region: {
                name: { contains: query, mode: "insensitive" as const },
              },
            },
            {
              region: {
                code: { contains: query, mode: "insensitive" as const },
              },
            },
          ],
        }
      : {};

    const airports = await prisma.airport.findMany({
      where: whereClause,
      select: {
        id: true,
        ident: true,
        type: true,
        name: true,
        latitude: true,
        longitude: true,
        elevationFt: true,
        municipality: true,
        icaoCode: true,
        iataCode: true,
        country: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        region: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
      take: limit * 3,
      orderBy: [{ name: "asc" }],
    });

    // Sort results to prioritize exact matches
    const queryLower = query.toLowerCase();
    const sortedAirports = airports.sort((a, b) => {
      // Exact IATA code match first
      const aIataExact = a.iataCode?.toLowerCase() === queryLower ? 0 : 1;
      const bIataExact = b.iataCode?.toLowerCase() === queryLower ? 0 : 1;
      if (aIataExact !== bIataExact) return aIataExact - bIataExact;

      // Exact ICAO code match second
      const aIcaoExact = a.icaoCode?.toLowerCase() === queryLower ? 0 : 1;
      const bIcaoExact = b.icaoCode?.toLowerCase() === queryLower ? 0 : 1;
      if (aIcaoExact !== bIcaoExact) return aIcaoExact - bIcaoExact;

      // IATA/ICAO starts with query
      const aCodeStarts =
        a.iataCode?.toLowerCase().startsWith(queryLower) ||
        a.icaoCode?.toLowerCase().startsWith(queryLower)
          ? 0
          : 1;
      const bCodeStarts =
        b.iataCode?.toLowerCase().startsWith(queryLower) ||
        b.icaoCode?.toLowerCase().startsWith(queryLower)
          ? 0
          : 1;
      if (aCodeStarts !== bCodeStarts) return aCodeStarts - bCodeStarts;

      // City/municipality starts with query
      const aCityStarts = a.municipality?.toLowerCase().startsWith(queryLower)
        ? 0
        : 1;
      const bCityStarts = b.municipality?.toLowerCase().startsWith(queryLower)
        ? 0
        : 1;
      if (aCityStarts !== bCityStarts) return aCityStarts - bCityStarts;

      // Name starts with query
      const aNameStarts = a.name.toLowerCase().startsWith(queryLower) ? 0 : 1;
      const bNameStarts = b.name.toLowerCase().startsWith(queryLower) ? 0 : 1;
      if (aNameStarts !== bNameStarts) return aNameStarts - bNameStarts;

      // Alphabetical by name
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json({ airports: sortedAirports.slice(0, limit) });
  } catch (error) {
    console.error("Failed to fetch airports:", error);
    return NextResponse.json(
      { error: "Failed to fetch airports" },
      { status: 500 },
    );
  }
}

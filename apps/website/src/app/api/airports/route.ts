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
            { country: { name: { contains: query, mode: "insensitive" as const } } },
            { region: { name: { contains: query, mode: "insensitive" as const } } },
          ],
        }
      : {};

    const airports = await prisma.airport.findMany({
      where: whereClause,
      include: {
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
      take: limit,
      orderBy: [
        { name: "asc" },
      ],
    });

    return NextResponse.json({ airports });
  } catch (error) {
    console.error("Failed to fetch airports:", error);
    return NextResponse.json(
      { error: "Failed to fetch airports" },
      { status: 500 }
    );
  }
}

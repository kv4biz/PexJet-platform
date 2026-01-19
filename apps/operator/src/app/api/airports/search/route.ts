import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pexjet/database";
import { verifyAuth, unauthorizedResponse } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const operator = await verifyAuth(request);
  if (!operator) return unauthorizedResponse();

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";

    if (query.length < 2) {
      return NextResponse.json({ airports: [] });
    }

    const airports = await prisma.airport.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { municipality: { contains: query, mode: "insensitive" } },
          { iataCode: { contains: query, mode: "insensitive" } },
          { icaoCode: { contains: query, mode: "insensitive" } },
        ],
        type: { in: ["large_airport", "medium_airport"] },
      },
      include: {
        country: {
          select: { name: true },
        },
      },
      take: 20,
      orderBy: [{ type: "asc" }, { name: "asc" }],
    });

    return NextResponse.json({ airports });
  } catch (error) {
    console.error("Airport search error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

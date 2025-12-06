import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pexjet/database";
import { verifyAuth, unauthorizedResponse } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const operator = await verifyAuth(request);
  if (!operator) return unauthorizedResponse();

  try {
    const aircraft = await prisma.aircraft.findMany({
      where: {
        availability: { in: ["LOCAL", "INTERNATIONAL", "BOTH"] },
      },
      select: {
        id: true,
        name: true,
        manufacturer: true,
        model: true,
        category: true,
        passengerCapacityMin: true,
        passengerCapacityMax: true,
        rangeNm: true,
        cruiseSpeedKnots: true,
        thumbnailImage: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ aircraft });
  } catch (error) {
    console.error("Aircraft fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

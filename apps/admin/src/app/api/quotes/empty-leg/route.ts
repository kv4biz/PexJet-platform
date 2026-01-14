import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pexjet/database";
import { verifyAccessToken, extractTokenFromHeader } from "@pexjet/lib";

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status");

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (status && status !== "all") {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { referenceNumber: { contains: search, mode: "insensitive" } },
        { clientName: { contains: search, mode: "insensitive" } },
        { clientEmail: { contains: search, mode: "insensitive" } },
        { clientPhone: { contains: search, mode: "insensitive" } },
      ];
    }

    // Get total count
    const total = await prisma.emptyLegBooking.count({ where });

    // Get empty leg bookings with relations
    const quotes = await prisma.emptyLegBooking.findMany({
      where,
      include: {
        emptyLeg: {
          include: {
            departureAirport: {
              select: { id: true, name: true, icaoCode: true, iataCode: true },
            },
            arrivalAirport: {
              select: { id: true, name: true, icaoCode: true, iataCode: true },
            },
            aircraft: {
              select: { id: true, name: true, manufacturer: true },
            },
          },
        },
        client: {
          select: { id: true, fullName: true, email: true, phone: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    return NextResponse.json({
      quotes,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error("Failed to fetch empty leg quotes:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch empty leg quotes" },
      { status: 500 },
    );
  }
}

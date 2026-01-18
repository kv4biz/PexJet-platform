import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pexjet/database";
import { verifyAccessToken, extractTokenFromHeader } from "@pexjet/lib";

export async function GET(request: NextRequest) {
  try {
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
    const status = searchParams.get("status") || "";
    const type = searchParams.get("type") || "";

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        {
          referenceNumber: { contains: search, mode: "insensitive" },
        },
        {
          client: {
            fullName: { contains: search, mode: "insensitive" },
          },
        },
        {
          client: {
            email: { contains: search, mode: "insensitive" },
          },
        },
      ];
    }

    if (status && status !== "all") {
      where.status = status;
    }

    if (type && type !== "all") {
      where.type = type;
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          client: {
            select: {
              fullName: true,
              email: true,
              phone: true,
            },
          },
          charterQuote: {
            select: {
              referenceNumber: true,
              clientName: true,
              totalPriceUsd: true,
              flightType: true,
              legs: {
                select: {
                  departureAirport: {
                    select: { name: true, icaoCode: true },
                  },
                  arrivalAirport: {
                    select: { name: true, icaoCode: true },
                  },
                  departureDateTime: true,
                },
              },
            },
          },
          emptyLegBooking: {
            select: {
              referenceNumber: true,
              clientName: true,
              totalPriceUsd: true,
              seatsRequested: true,
              emptyLeg: {
                select: {
                  departureAirport: {
                    select: { name: true, icaoCode: true },
                  },
                  arrivalAirport: {
                    select: { name: true, icaoCode: true },
                  },
                  departureDateTime: true,
                  aircraft: {
                    select: { name: true, manufacturer: true },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.payment.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      payments,
      totalPages,
      currentPage: page,
      total,
    });
  } catch (error) {
    console.error("Failed to fetch payments:", error);
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 },
    );
  }
}

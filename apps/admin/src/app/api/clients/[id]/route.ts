import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pexjet/database";
import { verifyAccessToken, extractTokenFromHeader } from "@pexjet/lib";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
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

    // Fetch client with all related data
    const client = await prisma.client.findUnique({
      where: { id: params.id },
      include: {
        charterQuotes: {
          include: {
            legs: {
              include: {
                departureAirport: {
                  select: {
                    name: true,
                    icaoCode: true,
                    iataCode: true,
                    municipality: true,
                  },
                },
                arrivalAirport: {
                  select: {
                    name: true,
                    icaoCode: true,
                    iataCode: true,
                    municipality: true,
                  },
                },
                aircraft: {
                  select: { name: true },
                },
              },
            },
            payment: {
              select: { status: true, paidAt: true, amountUsd: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        emptyLegBookings: {
          include: {
            emptyLeg: {
              include: {
                departureAirport: {
                  select: {
                    name: true,
                    icaoCode: true,
                    iataCode: true,
                    municipality: true,
                  },
                },
                arrivalAirport: {
                  select: {
                    name: true,
                    icaoCode: true,
                    iataCode: true,
                    municipality: true,
                  },
                },
                aircraft: {
                  select: { name: true },
                },
              },
            },
            payment: {
              select: { status: true, paidAt: true, amountUsd: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        payments: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            referenceNumber: true,
            type: true,
            method: true,
            amountUsd: true,
            status: true,
            paidAt: true,
            createdAt: true,
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Calculate totals
    const totalCharterQuotes = client.charterQuotes.length;
    const totalEmptyLegBookings = client.emptyLegBookings.length;
    const paidCharterQuotes = client.charterQuotes.filter(
      (q) => q.status === "PAID" || q.status === "COMPLETED",
    ).length;
    const paidEmptyLegBookings = client.emptyLegBookings.filter(
      (b) => b.status === "PAID" || b.status === "COMPLETED",
    ).length;
    const totalSpentUsd = client.payments
      .filter((p) => p.status === "SUCCESS")
      .reduce((sum, p) => sum + p.amountUsd, 0);

    return NextResponse.json({
      client,
      stats: {
        totalCharterQuotes,
        totalEmptyLegBookings,
        paidCharterQuotes,
        paidEmptyLegBookings,
        totalSpentUsd,
      },
    });
  } catch (error: any) {
    console.error("Client fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch client details" },
      { status: 500 },
    );
  }
}

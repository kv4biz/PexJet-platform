import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pexjet/database";
import { verifyAccessToken, extractTokenFromHeader } from "@pexjet/lib";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const token = extractTokenFromHeader(request.headers.get("authorization"));
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyAccessToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { id } = params;

    const payment = await prisma.payment.findUnique({
      where: { id },
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
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    return NextResponse.json({ payment });
  } catch (error) {
    console.error("Failed to fetch payment:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment" },
      { status: 500 },
    );
  }
}

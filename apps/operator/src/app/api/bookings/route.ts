import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pexjet/database";
import { verifyAuth, unauthorizedResponse } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const operator = await verifyAuth(request);
  if (!operator) return unauthorizedResponse();

  try {
    const bookings = await prisma.emptyLegBooking.findMany({
      where: {
        emptyLeg: { createdByOperatorId: operator.id },
      },
      include: {
        emptyLeg: {
          select: {
            departureAirport: {
              select: { iataCode: true, municipality: true },
            },
            arrivalAirport: {
              select: { iataCode: true, municipality: true },
            },
            departureDateTime: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error("Bookings fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

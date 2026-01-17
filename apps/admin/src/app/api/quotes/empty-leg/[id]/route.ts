import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pexjet/database";
import { verifyAccessToken, extractTokenFromHeader } from "@pexjet/lib";

/**
 * GET /api/quotes/empty-leg/[id]
 * Get a single empty leg booking/quote by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const token = extractTokenFromHeader(request.headers.get("authorization"));
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = verifyAccessToken(token);
  if (!payload) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  try {
    const { id } = params;

    const booking = await prisma.emptyLegBooking.findUnique({
      where: { id },
      include: {
        emptyLeg: {
          include: {
            departureAirport: {
              select: {
                id: true,
                name: true,
                icaoCode: true,
                iataCode: true,
                municipality: true,
              },
            },
            arrivalAirport: {
              select: {
                id: true,
                name: true,
                icaoCode: true,
                iataCode: true,
                municipality: true,
              },
            },
            aircraft: {
              select: {
                id: true,
                name: true,
                manufacturer: true,
              },
            },
          },
        },
        client: {
          select: {
            id: true,
            email: true,
            phone: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    return NextResponse.json({ booking });
  } catch (error) {
    console.error("Failed to fetch empty leg booking:", error);
    return NextResponse.json(
      { error: "Failed to fetch booking" },
      { status: 500 },
    );
  }
}

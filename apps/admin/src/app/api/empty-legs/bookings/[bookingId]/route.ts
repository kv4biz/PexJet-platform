import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pexjet/database";
import { verifyAccessToken, extractTokenFromHeader } from "@pexjet/lib";

export async function GET(
  request: NextRequest,
  { params }: { params: { bookingId: string } },
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

    const { bookingId } = await params;

    const booking = await prisma.emptyLegBooking.findUnique({
      where: { id: bookingId },
      include: {
        emptyLeg: {
          include: {
            aircraft: {
              select: {
                id: true,
                name: true,
                model: true,
                manufacturer: true,
                category: true,
              },
            },
            departureAirport: {
              select: {
                id: true,
                name: true,
                municipality: true,
                iataCode: true,
                icaoCode: true,
                countryCode: true,
              },
            },
            arrivalAirport: {
              select: {
                id: true,
                name: true,
                municipality: true,
                iataCode: true,
                icaoCode: true,
                countryCode: true,
              },
            },
          },
        },
        client: true,
        approvedBy: {
          select: { id: true, fullName: true },
        },
        payment: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    return NextResponse.json(booking);
  } catch (error: any) {
    console.error("Booking fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch booking" },
      { status: 500 },
    );
  }
}

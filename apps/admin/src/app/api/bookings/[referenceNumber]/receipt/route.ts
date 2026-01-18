import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pexjet/database";
import { verifyAccessToken, extractTokenFromHeader } from "@pexjet/lib";

export async function GET(
  request: NextRequest,
  { params }: { params: { referenceNumber: string } },
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

    const { referenceNumber } = params;

    // Find empty leg booking by reference number
    const booking = await prisma.emptyLegBooking.findUnique({
      where: { referenceNumber },
      include: {
        client: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Check if booking has receipt URL
    if (!booking.receiptUrl) {
      return NextResponse.json(
        { error: "No receipt available" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      receiptUrl: booking.receiptUrl,
      referenceNumber: booking.referenceNumber,
      clientName: booking.clientName,
    });
  } catch (error) {
    console.error("Failed to fetch receipt:", error);
    return NextResponse.json(
      { error: "Failed to fetch receipt" },
      { status: 500 },
    );
  }
}

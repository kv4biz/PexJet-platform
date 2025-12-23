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

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "";

    const where: any = { emptyLegId: id };
    if (status) {
      where.status = status;
    }

    const bookings = await prisma.emptyLegBooking.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            fullName: true,
          },
        },
        payment: {
          select: {
            id: true,
            status: true,
            amountUsd: true,
            paidAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ bookings });
  } catch (error: any) {
    console.error("Bookings fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 },
    );
  }
}

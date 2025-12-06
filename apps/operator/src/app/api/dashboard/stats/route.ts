import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pexjet/database";
import { verifyAuth, unauthorizedResponse } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const operator = await verifyAuth(request);
  if (!operator) return unauthorizedResponse();

  try {
    // Get fleet count
    const fleetCount = await prisma.operatorFleet.count({
      where: { operatorId: operator.id },
    });

    // Get active empty legs count
    const activeEmptyLegs = await prisma.emptyLeg.count({
      where: {
        createdByOperatorId: operator.id,
        status: { in: ["PUBLISHED", "OPEN"] },
        departureDateTime: { gt: new Date() },
      },
    });

    // Get pending quotes count
    const pendingQuotes = await prisma.emptyLegBooking.count({
      where: {
        emptyLeg: { createdByOperatorId: operator.id },
        status: "PENDING",
      },
    });

    // Get total earnings (from completed payments)
    const totalEarningsResult = await prisma.payment.aggregate({
      where: {
        emptyLegBooking: {
          emptyLeg: { createdByOperatorId: operator.id },
        },
        status: "SUCCESS",
      },
      _sum: { operatorAmount: true },
    });

    // Get monthly earnings
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyEarningsResult = await prisma.payment.aggregate({
      where: {
        emptyLegBooking: {
          emptyLeg: { createdByOperatorId: operator.id },
        },
        status: "SUCCESS",
        paidAt: { gte: startOfMonth },
      },
      _sum: { operatorAmount: true },
    });

    // Get recent bookings
    const recentBookings = await prisma.emptyLegBooking.findMany({
      where: {
        emptyLeg: { createdByOperatorId: operator.id },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        referenceNumber: true,
        clientName: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      fleetCount,
      activeEmptyLegs,
      pendingQuotes,
      totalEarnings: totalEarningsResult._sum.operatorAmount || 0,
      monthlyEarnings: monthlyEarningsResult._sum.operatorAmount || 0,
      recentBookings,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

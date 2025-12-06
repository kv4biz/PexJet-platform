import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pexjet/database";
import { verifyAuth, unauthorizedResponse } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const operator = await verifyAuth(request);
  if (!operator) return unauthorizedResponse();

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const period = searchParams.get("period");

    // Build date filter
    let dateFilter = {};
    if (period === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      dateFilter = { gte: weekAgo };
    } else if (period === "month") {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      dateFilter = { gte: monthAgo };
    } else if (period === "year") {
      const yearAgo = new Date();
      yearAgo.setFullYear(yearAgo.getFullYear() - 1);
      dateFilter = { gte: yearAgo };
    }

    // Build where clause
    const whereClause: any = {
      emptyLeg: { createdByOperatorId: operator.id },
    };

    if (status && status !== "all") {
      whereClause.status = status as any;
    }

    if (Object.keys(dateFilter).length > 0) {
      whereClause.createdAt = dateFilter;
    }

    // Get bookings with payments
    const bookings = await prisma.emptyLegBooking.findMany({
      where: whereClause,
      include: {
        emptyLeg: {
          include: {
            departureAirport: {
              select: { iataCode: true, municipality: true },
            },
            arrivalAirport: { select: { iataCode: true, municipality: true } },
          },
        },
        payment: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Transform to history format
    const history = bookings.map((booking: any) => ({
      id: booking.id,
      referenceNumber: booking.referenceNumber,
      type: "EMPTY_LEG",
      clientName: booking.clientName,
      route: `${booking.emptyLeg.departureAirport.iataCode || booking.emptyLeg.departureAirport.municipality} → ${booking.emptyLeg.arrivalAirport.iataCode || booking.emptyLeg.arrivalAirport.municipality}`,
      date: booking.emptyLeg.departureDateTime.toISOString(),
      seats: booking.seatsRequested,
      totalAmount: booking.totalPriceNgn,
      operatorAmount: booking.payment?.operatorAmount || 0,
      status: booking.status,
      paidAt: booking.payment?.paidAt?.toISOString() || null,
    }));

    // Calculate summary
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [totalEarningsResult, monthlyEarningsResult, pendingPaymentsResult] =
      await Promise.all([
        prisma.payment.aggregate({
          where: {
            emptyLegBooking: {
              emptyLeg: { createdByOperatorId: operator.id },
            },
            status: "SUCCESS",
          },
          _sum: { operatorAmount: true },
        }),
        prisma.payment.aggregate({
          where: {
            emptyLegBooking: {
              emptyLeg: { createdByOperatorId: operator.id },
            },
            status: "SUCCESS",
            paidAt: { gte: startOfMonth },
          },
          _sum: { operatorAmount: true },
        }),
        prisma.payment.aggregate({
          where: {
            emptyLegBooking: {
              emptyLeg: { createdByOperatorId: operator.id },
            },
            status: "PENDING",
          },
          _sum: { operatorAmount: true },
        }),
      ]);

    const completedDeals = await prisma.emptyLegBooking.count({
      where: {
        emptyLeg: { createdByOperatorId: operator.id },
        status: { in: ["PAID", "COMPLETED"] },
      },
    });

    const summary = {
      totalEarnings: totalEarningsResult._sum.operatorAmount || 0,
      monthlyEarnings: monthlyEarningsResult._sum.operatorAmount || 0,
      pendingPayments: pendingPaymentsResult._sum.operatorAmount || 0,
      completedDeals,
    };

    return NextResponse.json({ history, summary });
  } catch (error) {
    console.error("History fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

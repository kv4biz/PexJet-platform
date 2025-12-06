import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pexjet/database";
import { verifyAccessToken, extractTokenFromHeader } from "@pexjet/lib";

// Helper function to get monthly approvals for the last 12 months
async function getMonthlyApprovals() {
  const months: { month: string; count: number }[] = [];
  const now = new Date();
  
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
    
    const count = await prisma.charterQuote.count({
      where: {
        status: "APPROVED",
        updatedAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });
    
    const monthName = date.toLocaleString("en-US", { month: "short" });
    months.push({ month: monthName, count });
  }
  
  return months;
}

export async function GET(request: NextRequest) {
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

    // Fetch dashboard statistics
    const [
      totalQuotes,
      pendingQuotes,
      totalClients,
      totalAircraft,
      activeEmptyLegs,
      totalRevenue,
      recentQuotes,
      recentPayments,
    ] = await Promise.all([
      // Total quotes
      prisma.charterQuote.count(),
      
      // Pending quotes
      prisma.charterQuote.count({
        where: { status: "PENDING" },
      }),
      
      // Total clients
      prisma.client.count(),
      
      // Total aircraft (with any availability)
      prisma.aircraft.count({
        where: { availability: { not: "NONE" } },
      }),
      
      // Active empty legs (PUBLISHED or OPEN with future departure)
      prisma.emptyLeg.count({
        where: {
          status: { in: ["PUBLISHED", "OPEN"] },
          departureDateTime: { gte: new Date() },
        },
      }),
      
      // Total revenue from successful payments
      prisma.payment.aggregate({
        where: { status: "SUCCESS" },
        _sum: { amountNgn: true },
      }),
      
      // Recent quotes (last 5)
      prisma.charterQuote.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          referenceNumber: true,
          status: true,
          createdAt: true,
          clientName: true,
        },
      }),
      
      // Recent payments (last 5)
      prisma.payment.findMany({
        take: 5,
        where: { status: "SUCCESS" },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          referenceNumber: true,
          amountNgn: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    // Get monthly approvals for the last 12 months
    const monthlyApprovals = await getMonthlyApprovals();

    // Get staff members for STAFF role dashboard
    const staffMembers = await prisma.admin.findMany({
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        status: true,
        avatar: true,
      },
      orderBy: { fullName: "asc" },
      take: 10,
    });

    return NextResponse.json({
      totalQuotes,
      pendingQuotes,
      totalClients,
      totalAircraft,
      activeEmptyLegs,
      totalRevenue: totalRevenue._sum.amountNgn || 0,
      recentQuotes,
      recentPayments: recentPayments.map((p: typeof recentPayments[number]) => ({
        ...p,
        amount: p.amountNgn,
      })),
      monthlyApprovals,
      staffMembers,
    });
  } catch (error: any) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}

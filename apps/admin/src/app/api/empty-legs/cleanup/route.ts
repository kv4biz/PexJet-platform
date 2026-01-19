import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pexjet/database";
import { verifyAccessToken, extractTokenFromHeader } from "@pexjet/lib";

/**
 * POST /api/empty-legs/cleanup
 * Mark expired empty legs (past departure date) as EXPIRED
 * Only marks ADMIN and OPERATOR sourced deals (InstaCharter deals are deleted on sync)
 */
export async function POST(request: NextRequest) {
  const token = extractTokenFromHeader(request.headers.get("authorization"));
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = verifyAccessToken(token);
  if (!payload) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  try {
    const now = new Date();

    // Find all PUBLISHED/OPEN empty legs with past departure dates
    // Only for ADMIN and OPERATOR sources (InstaCharter deals are deleted on sync)
    const expiredDeals = await prisma.emptyLeg.updateMany({
      where: {
        departureDateTime: { lt: now },
        status: { in: ["PUBLISHED", "OPEN"] },
        source: { in: ["ADMIN", "OPERATOR"] },
      },
      data: {
        status: "EXPIRED",
      },
    });

    // Log activity
    if (expiredDeals.count > 0) {
      await prisma.activityLog.create({
        data: {
          action: "EMPTY_LEG_CLEANUP",
          description: `Marked ${expiredDeals.count} expired empty leg(s) as EXPIRED`,
          adminId: payload.sub,
          targetType: "EmptyLeg",
          targetId: "cleanup",
          metadata: { count: expiredDeals.count },
        },
      });
    }

    return NextResponse.json({
      success: true,
      expiredCount: expiredDeals.count,
      message:
        expiredDeals.count > 0
          ? `Marked ${expiredDeals.count} empty leg(s) as expired`
          : "No expired empty legs found",
    });
  } catch (error) {
    console.error("Failed to cleanup expired empty legs:", error);
    return NextResponse.json(
      { error: "Failed to cleanup expired empty legs" },
      { status: 500 },
    );
  }
}

/**
 * GET /api/empty-legs/cleanup
 * Get count of expired empty legs that need cleanup
 */
export async function GET(request: NextRequest) {
  const token = extractTokenFromHeader(request.headers.get("authorization"));
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = verifyAccessToken(token);
  if (!payload) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  try {
    const now = new Date();

    // Count PUBLISHED/OPEN empty legs with past departure dates
    const expiredCount = await prisma.emptyLeg.count({
      where: {
        departureDateTime: { lt: now },
        status: { in: ["PUBLISHED", "OPEN"] },
        source: { in: ["ADMIN", "OPERATOR"] },
      },
    });

    return NextResponse.json({
      expiredCount,
      hasExpired: expiredCount > 0,
    });
  } catch (error) {
    console.error("Failed to check expired empty legs:", error);
    return NextResponse.json(
      { error: "Failed to check expired empty legs" },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pexjet/database";
import { verifyAccessToken, extractTokenFromHeader } from "@pexjet/lib";

// Actions visible to staff (non-super_admin)
const STAFF_VISIBLE_ACTIONS = [
  "CHARTER_QUOTE_CREATE",
  "CHARTER_QUOTE_APPROVE",
  "CHARTER_QUOTE_REJECT",
  "CHARTER_QUOTE_EXPIRE",
  "EMPTY_LEG_CREATE",
  "EMPTY_LEG_UPDATE",
  "EMPTY_LEG_CLOSE",
  "EMPTY_LEG_QUOTE_CREATE",
  "EMPTY_LEG_QUOTE_APPROVE",
  "EMPTY_LEG_QUOTE_REJECT",
  "ANNOUNCEMENT_CREATE",
  "ANNOUNCEMENT_DELETE",
];

// GET - Fetch notifications (activity logs) with unseen count
export async function GET(request: NextRequest) {
  try {
    const token = extractTokenFromHeader(request.headers.get("authorization"));
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyAccessToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const countOnly = searchParams.get("countOnly") === "true";

    const isSuperAdmin = payload.role === "SUPER_ADMIN";

    // Build where clause based on role
    const where = isSuperAdmin
      ? {} // Super admin sees all
      : { action: { in: STAFF_VISIBLE_ACTIONS as any } };

    // Get unseen count
    const unseenCount = await prisma.activityLog.count({
      where: {
        ...where,
        NOT: {
          seenBy: {
            has: payload.sub,
          },
        },
      },
    });

    // If only count requested, return early
    if (countOnly) {
      return NextResponse.json({ unseenCount });
    }

    // Fetch recent logs
    const logs = await prisma.activityLog.findMany({
      where,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        admin: {
          select: {
            id: true,
            fullName: true,
            avatar: true,
          },
        },
      },
    });

    // Mark which ones are unseen for this user
    const logsWithSeenStatus = logs.map((log) => ({
      ...log,
      isSeen: log.seenBy.includes(payload.sub),
    }));

    return NextResponse.json({
      logs: logsWithSeenStatus,
      unseenCount,
    });
  } catch (error: any) {
    console.error("Notifications fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

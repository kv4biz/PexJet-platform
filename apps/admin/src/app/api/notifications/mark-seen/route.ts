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

// POST - Mark all notifications as seen
export async function POST(request: NextRequest) {
  try {
    const token = extractTokenFromHeader(request.headers.get("authorization"));
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyAccessToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const isSuperAdmin = payload.role === "SUPER_ADMIN";

    // Build where clause based on role
    const where = isSuperAdmin
      ? {
          NOT: {
            seenBy: {
              has: payload.sub,
            },
          },
        }
      : {
          action: { in: STAFF_VISIBLE_ACTIONS as any },
          NOT: {
            seenBy: {
              has: payload.sub,
            },
          },
        };

    // Get all unseen logs
    const unseenLogs = await prisma.activityLog.findMany({
      where,
      select: { id: true, seenBy: true },
    });

    // Update each log to add this admin to seenBy
    await Promise.all(
      unseenLogs.map((log) =>
        prisma.activityLog.update({
          where: { id: log.id },
          data: {
            seenBy: {
              push: payload.sub,
            },
          },
        })
      )
    );

    return NextResponse.json({
      message: "All notifications marked as seen",
      count: unseenLogs.length,
    });
  } catch (error: any) {
    console.error("Mark seen error:", error);
    return NextResponse.json(
      { error: "Failed to mark notifications as seen" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken, extractTokenFromHeader } from "@pexjet/lib";
import { prisma } from "@pexjet/database";

export async function POST(request: NextRequest) {
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

    // Get admin to check if super admin
    const admin = await prisma.admin.findUnique({
      where: { id: payload.sub },
    });

    if (!admin || admin.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Only Super Admin can perform cleanup" },
        { status: 403 },
      );
    }

    // Count existing InstaCharter deals
    const count = await prisma.emptyLeg.count({
      where: { source: "INSTACHARTER" },
    });

    if (count === 0) {
      return NextResponse.json({
        success: true,
        message: "No InstaCharter deals found to clean up",
        removed: 0,
      });
    }

    // Delete all InstaCharter deals
    const result = await prisma.emptyLeg.deleteMany({
      where: { source: "INSTACHARTER" },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "EMPTY_LEG_CLOSE",
        targetType: "EmptyLeg",
        targetId: "bulk-cleanup",
        adminId: payload.sub,
        description: `Cleaned up ${result.count} InstaCharter deals`,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        metadata: {
          removedCount: result.count,
          source: "INSTACHARTER",
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully removed ${result.count} InstaCharter deals`,
      removed: result.count,
    });
  } catch (error: any) {
    console.error("InstaCharter cleanup error:", error);
    return NextResponse.json(
      {
        error: "Failed to cleanup InstaCharter deals",
        message: error.message,
      },
      { status: 500 },
    );
  }
}

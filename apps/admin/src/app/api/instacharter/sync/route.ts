import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pexjet/database";
import {
  verifyAccessToken,
  extractTokenFromHeader,
  syncInstaCharterDeals,
  getLastSyncStatus,
  getSyncHistory,
} from "@pexjet/lib";

/**
 * GET /api/instacharter/sync
 * Get sync status and history
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
    const [status, history] = await Promise.all([
      getLastSyncStatus(prisma),
      getSyncHistory(prisma, 10),
    ]);

    return NextResponse.json({
      status,
      history,
    });
  } catch (error) {
    console.error("Failed to get sync status:", error);
    return NextResponse.json(
      { error: "Failed to get sync status" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/instacharter/sync
 * Trigger manual sync (Super Admin only)
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

  // Get admin from database
  const admin = await prisma.admin.findUnique({
    where: { id: payload.sub },
  });

  if (!admin) {
    return NextResponse.json({ error: "Admin not found" }, { status: 401 });
  }

  // Only Super Admin can trigger manual sync
  if (admin.role !== "SUPER_ADMIN") {
    return NextResponse.json(
      { error: "Only Super Admin can trigger manual sync" },
      { status: 403 },
    );
  }

  try {
    // Check if sync is already in progress
    const inProgress = await prisma.instaCharterSyncLog.findFirst({
      where: { status: "STARTED" },
      orderBy: { startedAt: "desc" },
    });

    if (inProgress) {
      // Check if it's been running for more than 10 minutes (likely stuck)
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      if (inProgress.startedAt > tenMinutesAgo) {
        return NextResponse.json(
          { error: "Sync already in progress" },
          { status: 409 },
        );
      }
      // Mark old stuck sync as failed
      await prisma.instaCharterSyncLog.update({
        where: { id: inProgress.id },
        data: {
          status: "FAILED",
          errorMessage: "Sync timed out",
          completedAt: new Date(),
        },
      });
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "INSTACHARTER_SYNC_START",
        description: `Manual InstaCharter sync started by ${admin.fullName}`,
        adminId: admin.id,
        targetType: "INSTACHARTER_SYNC",
        targetId: "manual",
        metadata: { triggeredBy: admin.fullName },
      },
    });

    // Run sync
    const result = await syncInstaCharterDeals(prisma, {
      syncType: "MANUAL",
      triggeredById: admin.id,
    });

    // Log completion
    await prisma.activityLog.create({
      data: {
        action: result.success
          ? "INSTACHARTER_SYNC_COMPLETE"
          : "INSTACHARTER_SYNC_ERROR",
        description: result.success
          ? `InstaCharter sync completed: ${result.dealsCreated} created, ${result.dealsUpdated} updated, ${result.dealsRemoved} removed`
          : `InstaCharter sync completed with ${result.errors.length} errors`,
        adminId: admin.id,
        targetType: "INSTACHARTER_SYNC",
        targetId: "manual",
        metadata: {
          dealsFound: result.dealsFound,
          dealsCreated: result.dealsCreated,
          dealsUpdated: result.dealsUpdated,
          dealsRemoved: result.dealsRemoved,
          duration: result.duration,
          errors: result.errors.length > 0 ? result.errors : undefined,
        },
      },
    });

    return NextResponse.json({
      success: result.success,
      message: result.success
        ? `Sync completed: ${result.dealsCreated} created, ${result.dealsUpdated} updated, ${result.dealsRemoved} removed`
        : `Sync completed with ${result.errors.length} errors`,
      result,
    });
  } catch (error) {
    console.error("Manual sync failed:", error);

    // Log error
    await prisma.activityLog.create({
      data: {
        action: "INSTACHARTER_SYNC_ERROR",
        description: `InstaCharter sync failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        adminId: admin.id,
        targetType: "INSTACHARTER_SYNC",
        targetId: "manual",
        metadata: {
          error: error instanceof Error ? error.message : "Unknown error",
        },
      },
    });

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sync failed" },
      { status: 500 },
    );
  }
}

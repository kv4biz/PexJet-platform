import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pexjet/database";
import { syncInstaCharterDeals } from "@pexjet/lib";

/**
 * GET /api/cron/instacharter-sync
 * Scheduled sync endpoint - called by cron job daily at midnight
 *
 * Protected by CRON_SECRET environment variable
 * Configure your cron service to call this endpoint with:
 * Authorization: Bearer <CRON_SECRET>
 */
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("[Cron] CRON_SECRET not configured");
    return NextResponse.json({ error: "Cron not configured" }, { status: 500 });
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    console.error("[Cron] Invalid authorization");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("[Cron] Starting scheduled InstaCharter sync...");

    // Check if sync is already in progress
    const inProgress = await prisma.instaCharterSyncLog.findFirst({
      where: { status: "STARTED" },
      orderBy: { startedAt: "desc" },
    });

    if (inProgress) {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      if (inProgress.startedAt > tenMinutesAgo) {
        console.log("[Cron] Sync already in progress, skipping");
        return NextResponse.json({
          success: false,
          message: "Sync already in progress",
        });
      }
      // Mark stuck sync as failed
      await prisma.instaCharterSyncLog.update({
        where: { id: inProgress.id },
        data: {
          status: "FAILED",
          errorMessage: "Sync timed out",
          completedAt: new Date(),
        },
      });
    }

    // Run sync
    const result = await syncInstaCharterDeals(prisma, {
      syncType: "SCHEDULED",
    });

    console.log(
      `[Cron] Sync completed: ${result.dealsCreated} created, ${result.dealsUpdated} updated, ${result.dealsRemoved} removed`,
    );

    return NextResponse.json({
      success: result.success,
      message: result.success
        ? `Sync completed successfully`
        : `Sync completed with ${result.errors.length} errors`,
      result,
    });
  } catch (error) {
    console.error("[Cron] Sync failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sync failed" },
      { status: 500 },
    );
  }
}

// Also support POST for flexibility with different cron services
export { GET as POST };

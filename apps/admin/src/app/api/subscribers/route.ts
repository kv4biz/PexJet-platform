import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pexjet/database";
import { verifyAccessToken, extractTokenFromHeader } from "@pexjet/lib";

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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type") || "";
    const status = searchParams.get("status") || "";

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (search) {
      where.phone = { contains: search, mode: "insensitive" };
    }

    if (type && type !== "all") {
      where.type = type;
    }

    if (status === "active") {
      where.isActive = true;
    } else if (status === "inactive") {
      where.isActive = false;
    }

    // Fetch subscribers with pagination
    const [subscribers, total] = await Promise.all([
      prisma.emptyLegSubscription.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.emptyLegSubscription.count({ where }),
    ]);

    // Get stats
    const stats = await prisma.emptyLegSubscription.groupBy({
      by: ["type"],
      where: { isActive: true },
      _count: true,
    });

    const activeCount = await prisma.emptyLegSubscription.count({
      where: { isActive: true },
    });

    return NextResponse.json({
      subscribers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      stats: {
        total,
        active: activeCount,
        byType: stats.reduce(
          (acc, s) => {
            acc[s.type] = s._count;
            return acc;
          },
          {} as Record<string, number>,
        ),
      },
    });
  } catch (error: any) {
    console.error("Subscribers fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscribers" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Subscriber ID is required" },
        { status: 400 },
      );
    }

    // Deactivate subscription
    await prisma.emptyLegSubscription.update({
      where: { id },
      data: { isActive: false },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "SUBSCRIPTION_DELETE",
        targetType: "EmptyLegSubscription",
        targetId: id,
        adminId: payload.sub,
        description: "Deactivated empty leg subscription",
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      },
    });

    return NextResponse.json({ message: "Subscription deactivated" });
  } catch (error: any) {
    console.error("Subscriber delete error:", error);
    return NextResponse.json(
      { error: "Failed to deactivate subscription" },
      { status: 500 },
    );
  }
}

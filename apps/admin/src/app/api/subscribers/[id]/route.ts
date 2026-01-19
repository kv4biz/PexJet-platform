import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pexjet/database";
import { verifyAccessToken, extractTokenFromHeader } from "@pexjet/lib";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = extractTokenFromHeader(request.headers.get("authorization"));
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyAccessToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { id } = await params;

    const subscriber = await prisma.emptyLegSubscription.findUnique({
      where: { id },
    });

    if (!subscriber) {
      return NextResponse.json(
        { error: "Subscriber not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ subscriber });
  } catch (error: any) {
    console.error("Subscriber fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscriber" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = extractTokenFromHeader(request.headers.get("authorization"));
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyAccessToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { type, cities, routeFrom, routeTo } = body;

    // Check if subscriber exists
    const existingSubscriber = await prisma.emptyLegSubscription.findUnique({
      where: { id },
    });

    if (!existingSubscriber) {
      return NextResponse.json(
        { error: "Subscriber not found" },
        { status: 404 },
      );
    }

    // Validate type if provided
    if (type && !["ALL", "CITY", "ROUTE"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid subscription type" },
        { status: 400 },
      );
    }

    // Validate type-specific fields
    if (type === "CITY" && (!cities || cities.length === 0)) {
      return NextResponse.json(
        { error: "At least one city is required for CITY subscription" },
        { status: 400 },
      );
    }

    if (type === "ROUTE" && (!routeFrom || !routeTo)) {
      return NextResponse.json(
        {
          error:
            "Both routeFrom and routeTo are required for ROUTE subscription",
        },
        { status: 400 },
      );
    }

    // Build update data
    const updateData: any = {};

    if (type) {
      updateData.type = type;
      // Reset type-specific fields based on new type
      if (type === "ALL") {
        updateData.cities = [];
        updateData.routeFrom = null;
        updateData.routeTo = null;
      } else if (type === "CITY") {
        updateData.cities = cities || [];
        updateData.routeFrom = null;
        updateData.routeTo = null;
      } else if (type === "ROUTE") {
        updateData.cities = [];
        updateData.routeFrom = routeFrom;
        updateData.routeTo = routeTo;
      }
    }

    // Update subscriber
    const subscription = await prisma.emptyLegSubscription.update({
      where: { id },
      data: updateData,
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "SUBSCRIPTION_UPDATE",
        targetType: "EmptyLegSubscription",
        targetId: id,
        adminId: payload.sub,
        description: `Updated subscription for ${subscription.phone}`,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        metadata: { type, cities, routeFrom, routeTo },
      },
    });

    return NextResponse.json({ subscription });
  } catch (error: any) {
    console.error("Subscriber update error:", error);
    return NextResponse.json(
      { error: "Failed to update subscriber" },
      { status: 500 },
    );
  }
}

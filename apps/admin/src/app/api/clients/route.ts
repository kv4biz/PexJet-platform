import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pexjet/database";
import { verifyAccessToken, extractTokenFromHeader } from "@pexjet/lib";

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

    const body = await request.json();
    const { phone, fullName, email } = body;

    // Validate required fields
    if (!phone) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 },
      );
    }

    // Check if client already exists
    const existingClient = await prisma.client.findUnique({
      where: { phone },
    });

    if (existingClient) {
      return NextResponse.json(
        { error: "A client with this phone number already exists" },
        { status: 400 },
      );
    }

    // Create new client
    const client = await prisma.client.create({
      data: {
        phone,
        fullName: fullName || null,
        email: email || null,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "CLIENT_CREATE",
        targetType: "Client",
        targetId: client.id,
        adminId: payload.sub,
        description: `Created client: ${fullName || phone}`,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        metadata: { phone, fullName, email },
      },
    });

    return NextResponse.json({ client }, { status: 201 });
  } catch (error: any) {
    console.error("Client create error:", error);
    return NextResponse.json(
      { error: "Failed to create client" },
      { status: 500 },
    );
  }
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";

    const skip = (page - 1) * limit;

    // Build where clause
    const where = search
      ? {
          OR: [
            { email: { contains: search, mode: "insensitive" as const } },
            { fullName: { contains: search, mode: "insensitive" as const } },
            { phone: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    // Fetch clients with pagination
    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          createdAt: true,
          _count: {
            select: {
              charterQuotes: true,
              emptyLegBookings: true,
            },
          },
        },
      }),
      prisma.client.count({ where }),
    ]);

    return NextResponse.json({
      clients,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error("Clients fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch clients" },
      { status: 500 },
    );
  }
}

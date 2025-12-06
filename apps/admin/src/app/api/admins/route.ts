import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pexjet/database";
import { verifyAccessToken, extractTokenFromHeader, isSuperAdmin, hashPassword, notifyNewStaff } from "@pexjet/lib";

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
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";

    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { email: { contains: search, mode: "insensitive" as const } },
            { username: { contains: search, mode: "insensitive" as const } },
            { fullName: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [admins, total] = await Promise.all([
      prisma.admin.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          username: true,
          fullName: true,
          phone: true,
          role: true,
          status: true,
          avatar: true,
          address: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.admin.count({ where }),
    ]);

    return NextResponse.json({
      admins,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error("Admins fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch admins" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = extractTokenFromHeader(request.headers.get("authorization"));
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyAccessToken(token);
    if (!payload || !isSuperAdmin(payload.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { email, username, password, fullName, phone, role, address } = body;

    if (!email || !username || !password || !fullName || !phone) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const existing = await prisma.admin.findFirst({
      where: { OR: [{ email }, { username }] },
    });

    if (existing) {
      return NextResponse.json({ error: "Email or username already exists" }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);

    const admin = await prisma.admin.create({
      data: {
        email: email.toLowerCase(),
        username: username.toLowerCase(),
        passwordHash,
        fullName,
        phone,
        role: role || "STAFF",
        address: address || null,
      },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        role: true,
      },
    });

    await prisma.activityLog.create({
      data: {
        action: "ADMIN_CREATE",
        targetType: "Admin",
        targetId: admin.id,
        adminId: payload.sub,
        description: `Created admin ${admin.fullName}`,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      },
    });

    // Trigger real-time update
    await notifyNewStaff({
      id: admin.id,
      fullName: admin.fullName,
      email: admin.email,
      role: admin.role,
    });

    return NextResponse.json(admin, { status: 201 });
  } catch (error: any) {
    console.error("Admin create error:", error);
    return NextResponse.json({ error: "Failed to create admin" }, { status: 500 });
  }
}

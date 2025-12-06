import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pexjet/database";
import { verifyAccessToken, extractTokenFromHeader, isSuperAdmin, hashPassword, notifyNewOperator } from "@pexjet/lib";

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

    const [operators, total] = await Promise.all([
      prisma.operator.findMany({
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
          avatar: true,
          bankName: true,
          bankAccountNumber: true,
          bankAccountName: true,
          commissionPercent: true,
          createdAt: true,
          _count: {
            select: { fleet: true },
          },
        },
      }),
      prisma.operator.count({ where }),
    ]);

    // Map to expected format for the page
    const mappedOperators = operators.map((op) => ({
      id: op.id,
      companyName: op.fullName, // Using fullName as company name
      contactName: op.username,
      email: op.email,
      phone: op.phone,
      website: null,
      address: null,
      city: null,
      country: null,
      status: "ACTIVE",
      createdAt: op.createdAt,
      _count: {
        fleets: op._count.fleet,
      },
    }));

    return NextResponse.json({
      operators: mappedOperators,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error("Operators fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch operators" }, { status: 500 });
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
    const { companyName, contactName, email, phone, password, website, address, city, country } = body;

    if (!companyName || !contactName || !email || !phone || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if email or username already exists
    const existing = await prisma.operator.findFirst({
      where: { OR: [{ email }, { username: contactName.toLowerCase().replace(/\s+/g, "") }] },
    });

    if (existing) {
      return NextResponse.json({ error: "Email or username already exists" }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);

    const operator = await prisma.operator.create({
      data: {
        email: email.toLowerCase(),
        username: contactName.toLowerCase().replace(/\s+/g, ""),
        passwordHash,
        fullName: companyName,
        phone,
        // Default bank details (can be updated later)
        bankName: "Pending",
        bankAccountNumber: "0000000000",
        bankAccountName: companyName,
      },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        phone: true,
        createdAt: true,
      },
    });

    // Trigger real-time update
    await notifyNewOperator({
      id: operator.id,
      companyName: operator.fullName,
      contactName: operator.username,
    });

    return NextResponse.json({
      id: operator.id,
      companyName: operator.fullName,
      contactName: operator.username,
      email: operator.email,
      phone: operator.phone,
      status: "ACTIVE",
      createdAt: operator.createdAt,
    }, { status: 201 });
  } catch (error: any) {
    console.error("Operator create error:", error);
    return NextResponse.json({ error: "Failed to create operator" }, { status: 500 });
  }
}

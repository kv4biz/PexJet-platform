import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pexjet/database";
import { verifyAccessToken, extractTokenFromHeader, isSuperAdmin, notifyOperatorUpdate, notifyOperatorDelete } from "@pexjet/lib";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const operator = await prisma.operator.findUnique({
      where: { id: params.id },
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
    });

    if (!operator) {
      return NextResponse.json({ error: "Operator not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: operator.id,
      companyName: operator.fullName,
      contactName: operator.username,
      email: operator.email,
      phone: operator.phone,
      website: null,
      address: null,
      city: null,
      country: null,
      status: "ACTIVE",
      createdAt: operator.createdAt,
      bankName: operator.bankName,
      bankAccountNumber: operator.bankAccountNumber,
      bankAccountName: operator.bankAccountName,
      commissionPercent: operator.commissionPercent,
      _count: {
        fleets: operator._count.fleet,
      },
    });
  } catch (error: any) {
    console.error("Operator fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch operator" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = extractTokenFromHeader(request.headers.get("authorization"));
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyAccessToken(token);
    if (!payload || !isSuperAdmin(payload.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const operator = await prisma.operator.findUnique({
      where: { id: params.id },
    });

    if (!operator) {
      return NextResponse.json({ error: "Operator not found" }, { status: 404 });
    }

    await prisma.operator.delete({
      where: { id: params.id },
    });

    // Trigger real-time update
    await notifyOperatorDelete({ id: params.id });

    return NextResponse.json({ message: "Operator deleted successfully" });
  } catch (error: any) {
    console.error("Operator delete error:", error);
    return NextResponse.json({ error: "Failed to delete operator" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const { companyName, contactName, email, phone, bankName, bankAccountNumber, bankAccountName, commissionPercent } = body;

    const operator = await prisma.operator.findUnique({
      where: { id: params.id },
    });

    if (!operator) {
      return NextResponse.json({ error: "Operator not found" }, { status: 404 });
    }

    const updated = await prisma.operator.update({
      where: { id: params.id },
      data: {
        ...(companyName && { fullName: companyName }),
        ...(contactName && { username: contactName.toLowerCase().replace(/\s+/g, "") }),
        ...(email && { email: email.toLowerCase() }),
        ...(phone && { phone }),
        ...(bankName && { bankName }),
        ...(bankAccountNumber && { bankAccountNumber }),
        ...(bankAccountName && { bankAccountName }),
        ...(commissionPercent !== undefined && { commissionPercent }),
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
    await notifyOperatorUpdate({
      id: updated.id,
      companyName: updated.fullName,
    });

    return NextResponse.json({
      id: updated.id,
      companyName: updated.fullName,
      contactName: updated.username,
      email: updated.email,
      phone: updated.phone,
      status: "ACTIVE",
      createdAt: updated.createdAt,
    });
  } catch (error: any) {
    console.error("Operator update error:", error);
    return NextResponse.json({ error: "Failed to update operator" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pexjet/database";
import { verifyAccessToken, extractTokenFromHeader, isSuperAdmin, hashPassword, notifyStaffUpdate, notifyStaffDelete } from "@pexjet/lib";

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

    const admin = await prisma.admin.findUnique({
      where: { id: params.id },
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
      },
    });

    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    return NextResponse.json(admin);
  } catch (error: any) {
    console.error("Admin fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch admin" }, { status: 500 });
  }
}

export async function PUT(
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
    const { fullName, phone, role, password, avatar, address } = body;

    const updateData: any = {};
    if (fullName !== undefined) updateData.fullName = fullName;
    if (phone !== undefined) updateData.phone = phone;
    if (role !== undefined) updateData.role = role;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (address !== undefined) updateData.address = address || null;
    if (password) updateData.passwordHash = await hashPassword(password);

    const admin = await prisma.admin.update({
      where: { id: params.id },
      data: updateData,
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
        action: "ADMIN_UPDATE",
        targetType: "Admin",
        targetId: admin.id,
        adminId: payload.sub,
        description: `Updated admin ${admin.fullName}`,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      },
    });

    // Trigger real-time update
    await notifyStaffUpdate({
      id: admin.id,
      fullName: admin.fullName,
    });

    return NextResponse.json(admin);
  } catch (error: any) {
    console.error("Admin update error:", error);
    return NextResponse.json({ error: "Failed to update admin" }, { status: 500 });
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

    if (params.id === payload.sub) {
      return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
    }

    const admin = await prisma.admin.findUnique({ where: { id: params.id } });
    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    await prisma.admin.delete({ where: { id: params.id } });

    await prisma.activityLog.create({
      data: {
        action: "ADMIN_DELETE",
        targetType: "Admin",
        targetId: params.id,
        adminId: payload.sub,
        description: `Deleted admin ${admin.fullName}`,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      },
    });

    // Trigger real-time update
    await notifyStaffDelete({ id: params.id });

    return NextResponse.json({ message: "Admin deleted successfully" });
  } catch (error: any) {
    console.error("Admin delete error:", error);
    return NextResponse.json({ error: "Failed to delete admin" }, { status: 500 });
  }
}

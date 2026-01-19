import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pexjet/database";
import { verifyAccessToken, extractTokenFromHeader, verifyPassword, hashPassword } from "@pexjet/lib";

// PUT - Change password
export async function PUT(request: NextRequest) {
  try {
    const token = extractTokenFromHeader(request.headers.get("authorization"));
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyAccessToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current password and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Get admin with password hash
    const admin = await prisma.admin.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        fullName: true,
        passwordHash: true,
      },
    });

    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    // Verify current password
    const isValidPassword = await verifyPassword(currentPassword, admin.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 }
      );
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password
    await prisma.admin.update({
      where: { id: payload.sub },
      data: { passwordHash: newPasswordHash },
    });

    return NextResponse.json({ message: "Password changed successfully" });
  } catch (error: any) {
    console.error("Password change error:", error);
    return NextResponse.json(
      { error: "Failed to change password" },
      { status: 500 }
    );
  }
}

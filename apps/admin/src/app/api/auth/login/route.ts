import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pexjet/database";
import { verifyPassword, generateTokens } from "@pexjet/lib";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Find admin by email
    const admin = await prisma.admin.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!admin) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Check if admin status (could add isActive field later)
    // For now, all admins are considered active

    // Verify password
    const isValidPassword = await verifyPassword(password, admin.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens({
      sub: admin.id,
      email: admin.email,
      role: admin.role,
      type: "admin",
    });

    // Update status to online
    await prisma.admin.update({
      where: { id: admin.id },
      data: { status: "ONLINE" },
    });

    return NextResponse.json({
      accessToken,
      refreshToken,
      user: {
        id: admin.id,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role,
        avatar: admin.avatar,
      },
    });
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "An error occurred during login" },
      { status: 500 }
    );
  }
}

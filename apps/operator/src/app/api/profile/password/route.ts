import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pexjet/database";
import { verifyAuth, unauthorizedResponse } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  const operator = await verifyAuth(request);
  if (!operator) return unauthorizedResponse();

  try {
    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current and new passwords are required" },
        { status: 400 },
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 },
      );
    }

    // Get operator with password
    const fullOperator = await prisma.operator.findUnique({
      where: { id: operator.id },
    });

    if (!fullOperator) {
      return NextResponse.json(
        { error: "Operator not found" },
        { status: 404 },
      );
    }

    // Verify current password
    const isValid = await bcrypt.compare(
      currentPassword,
      fullOperator.passwordHash,
    );

    if (!isValid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 },
      );
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.operator.update({
      where: { id: operator.id },
      data: { passwordHash },
    });

    return NextResponse.json({
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Password change error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

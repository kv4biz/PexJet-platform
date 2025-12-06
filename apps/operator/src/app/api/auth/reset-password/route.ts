import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pexjet/database";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { identifier, otp, newPassword } = await request.json();

    if (!identifier || !otp || !newPassword) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 },
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 },
      );
    }

    // Find operator
    const operator = await prisma.operator.findFirst({
      where: {
        OR: [
          { email: identifier.toLowerCase() },
          { username: identifier.toLowerCase() },
        ],
      },
    });

    if (!operator) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // Verify OTP again
    if (
      !operator.resetOtp ||
      operator.resetOtp !== otp ||
      !operator.resetOtpExpiry ||
      new Date() > operator.resetOtpExpiry
    ) {
      return NextResponse.json(
        { error: "Invalid or expired OTP" },
        { status: 400 },
      );
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update password and clear OTP
    await prisma.operator.update({
      where: { id: operator.id },
      data: {
        passwordHash,
        resetOtp: null,
        resetOtpExpiry: null,
      },
    });

    return NextResponse.json({
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

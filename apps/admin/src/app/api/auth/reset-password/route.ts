import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pexjet/database";
import { hashPassword } from "@pexjet/lib";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, otp, newPassword } = body;

    if (!email || !otp || !newPassword) {
      return NextResponse.json(
        { error: "Email, OTP, and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Find admin by email
    const admin = await prisma.admin.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!admin) {
      return NextResponse.json(
        { error: "Invalid request" },
        { status: 400 }
      );
    }

    // Verify OTP again
    if (admin.resetOtp !== otp) {
      return NextResponse.json(
        { error: "Invalid OTP" },
        { status: 400 }
      );
    }

    if (!admin.resetOtpExpiry || admin.resetOtpExpiry < new Date()) {
      return NextResponse.json(
        { error: "OTP has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password and clear reset OTP
    await prisma.admin.update({
      where: { id: admin.id },
      data: {
        passwordHash: hashedPassword,
        resetOtp: null,
        resetOtpExpiry: null,
      },
    });

    return NextResponse.json({
      message: "Password reset successfully",
    });
  } catch (error: any) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}

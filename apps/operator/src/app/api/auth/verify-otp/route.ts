import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pexjet/database";

export async function POST(request: NextRequest) {
  try {
    const { identifier, otp } = await request.json();

    if (!identifier || !otp) {
      return NextResponse.json(
        { error: "Identifier and OTP are required" },
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
      return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
    }

    // Verify OTP
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

    return NextResponse.json({
      message: "OTP verified successfully",
      verified: true,
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

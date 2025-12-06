import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pexjet/database";
import { generateOTP } from "@pexjet/lib";
import { sendOTPWhatsApp } from "@pexjet/lib";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Find admin by email
    const admin = await prisma.admin.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!admin) {
      return NextResponse.json(
        { error: "No admin found with this email" },
        { status: 400 }
      );
    }

    if (!admin.phone) {
      return NextResponse.json(
        { error: "No phone number associated with this account" },
        { status: 400 }
      );
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in database
    await prisma.admin.update({
      where: { id: admin.id },
      data: {
        resetOtp: otp,
        resetOtpExpiry: otpExpiry,
      },
    });

    // Send OTP via WhatsApp
    const result = await sendOTPWhatsApp(admin.phone, otp);

    if (!result.success) {
      console.error("Failed to send OTP:", result.error);
      return NextResponse.json(
        { error: "Failed to send OTP. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "OTP sent to your WhatsApp",
    });
  } catch (error: any) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}

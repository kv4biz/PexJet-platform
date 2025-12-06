import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pexjet/database";
import twilio from "twilio";

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN,
);

export async function POST(request: NextRequest) {
  try {
    const { identifier } = await request.json();

    if (!identifier) {
      return NextResponse.json(
        { error: "Email or username is required" },
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
      // Don't reveal if user exists
      return NextResponse.json({
        message: "If an account exists, an OTP has been sent",
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP
    await prisma.operator.update({
      where: { id: operator.id },
      data: {
        resetOtp: otp,
        resetOtpExpiry: otpExpiry,
      },
    });

    // Send OTP via WhatsApp
    try {
      await twilioClient.messages.create({
        body: `Your PexJet password reset code is: ${otp}\n\nThis code expires in 10 minutes.`,
        from: process.env.TWILIO_WHATSAPP_NUMBER,
        to: `whatsapp:${operator.phone}`,
      });
    } catch (twilioError) {
      console.error("Failed to send WhatsApp OTP:", twilioError);
      // Still return success to not reveal user existence
    }

    return NextResponse.json({
      message: "If an account exists, an OTP has been sent",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

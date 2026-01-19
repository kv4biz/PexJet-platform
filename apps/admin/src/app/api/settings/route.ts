import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pexjet/database";
import {
  verifyAccessToken,
  extractTokenFromHeader,
  isSuperAdmin,
} from "@pexjet/lib";

export async function GET(request: NextRequest) {
  try {
    const token = extractTokenFromHeader(request.headers.get("authorization"));
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyAccessToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    let settings = await prisma.settings.findUnique({
      where: { id: "default" },
    });

    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          id: "default",
          paymentWindowHours: 3,
          dealDeadlineMinutes: 30,
          minimumBookingNoticeHours: 24,
          defaultOperatorCommission: 10,
          supportEmail: "support@pexjet.com",
          supportPhone: "+2348000000000",
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error: any) {
    console.error("Settings fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
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
    const {
      paymentWindowHours,
      dealDeadlineMinutes,
      minimumBookingNoticeHours,
      defaultOperatorCommission,
      supportEmail,
      supportPhone,
      bankName,
      bankAccountName,
      bankAccountNumber,
      bankCode,
      companyName,
      companyEmail,
      companyPhone,
      companyAddress,
      facebookUrl,
      instagramUrl,
      linkedinUrl,
      twitterUrl,
      proofOfPaymentWhatsApp,
    } = body;

    const settings = await prisma.settings.upsert({
      where: { id: "default" },
      update: {
        ...(paymentWindowHours !== undefined && { paymentWindowHours }),
        ...(dealDeadlineMinutes !== undefined && { dealDeadlineMinutes }),
        ...(minimumBookingNoticeHours !== undefined && {
          minimumBookingNoticeHours,
        }),
        ...(defaultOperatorCommission !== undefined && {
          defaultOperatorCommission,
        }),
        ...(supportEmail !== undefined && { supportEmail }),
        ...(supportPhone !== undefined && { supportPhone }),
        ...(bankName !== undefined && { bankName }),
        ...(bankAccountName !== undefined && { bankAccountName }),
        ...(bankAccountNumber !== undefined && { bankAccountNumber }),
        ...(bankCode !== undefined && { bankCode }),
        ...(companyName !== undefined && { companyName }),
        ...(companyEmail !== undefined && { companyEmail }),
        ...(companyPhone !== undefined && { companyPhone }),
        ...(companyAddress !== undefined && { companyAddress }),
        ...(facebookUrl !== undefined && { facebookUrl }),
        ...(instagramUrl !== undefined && { instagramUrl }),
        ...(linkedinUrl !== undefined && { linkedinUrl }),
        ...(twitterUrl !== undefined && { twitterUrl }),
        ...(proofOfPaymentWhatsApp !== undefined && { proofOfPaymentWhatsApp }),
      },
      create: {
        id: "default",
        paymentWindowHours: paymentWindowHours || 3,
        dealDeadlineMinutes: dealDeadlineMinutes || 30,
        minimumBookingNoticeHours: minimumBookingNoticeHours || 24,
        defaultOperatorCommission: defaultOperatorCommission || 10,
        supportEmail: supportEmail || "support@pexjet.com",
        supportPhone: supportPhone || "+2348000000000",
        bankName: bankName || null,
        bankAccountName: bankAccountName || null,
        bankAccountNumber: bankAccountNumber || null,
        bankCode: bankCode || null,
        companyName: companyName || "PexJet",
        companyEmail: companyEmail || null,
        companyPhone: companyPhone || null,
        companyAddress: companyAddress || null,
        facebookUrl: facebookUrl || null,
        instagramUrl: instagramUrl || null,
        linkedinUrl: linkedinUrl || null,
        twitterUrl: twitterUrl || null,
        proofOfPaymentWhatsApp: proofOfPaymentWhatsApp || null,
      },
    });

    await prisma.activityLog.create({
      data: {
        action: "SETTINGS_UPDATE",
        targetType: "Settings",
        targetId: "default",
        adminId: payload.sub,
        description: "Updated platform settings",
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      },
    });

    return NextResponse.json(settings);
  } catch (error: any) {
    console.error("Settings update error:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 },
    );
  }
}

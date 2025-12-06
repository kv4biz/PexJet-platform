import { NextResponse } from "next/server";
import { prisma } from "@pexjet/database";

export async function GET() {
  try {
    const settings = await prisma.settings.findUnique({
      where: { id: "default" },
      select: { usdToNgnRate: true },
    });

    return NextResponse.json({
      rate: settings?.usdToNgnRate ?? 1650,
    });
  } catch (error) {
    console.error("Failed to fetch exchange rate:", error);
    return NextResponse.json({ rate: 1650 });
  }
}

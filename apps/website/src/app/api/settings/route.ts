import { NextResponse } from "next/server";
import { prisma } from "@pexjet/database";

export async function GET() {
  try {
    // Get settings or create default if not exists
    let settings = await prisma.settings.findUnique({
      where: { id: "default" },
    });

    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          id: "default",
        },
      });
    }

    return NextResponse.json({
      companyName: settings.companyName,
      companyEmail: settings.companyEmail,
      companyPhone: settings.companyPhone,
    });
  } catch (error: any) {
    console.error("Settings fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 },
    );
  }
}

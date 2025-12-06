import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pexjet/database";
import { verifyAuth, unauthorizedResponse } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const operator = await verifyAuth(request);
  if (!operator) return unauthorizedResponse();

  try {
    const fullOperator = await prisma.operator.findUnique({
      where: { id: operator.id },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        phone: true,
        avatar: true,
        bankName: true,
        bankAccountNumber: true,
        bankAccountName: true,
        commissionPercent: true,
      },
    });

    return NextResponse.json({ operator: fullOperator });
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const operator = await verifyAuth(request);
  if (!operator) return unauthorizedResponse();

  try {
    const { fullName, username, phone } = await request.json();

    // Check if username is taken
    if (username && username !== operator.username) {
      const existing = await prisma.operator.findUnique({
        where: { username: username.toLowerCase() },
      });

      if (existing) {
        return NextResponse.json(
          { error: "Username already taken" },
          { status: 400 },
        );
      }
    }

    const updatedOperator = await prisma.operator.update({
      where: { id: operator.id },
      data: {
        ...(fullName && { fullName }),
        ...(username && { username: username.toLowerCase() }),
        ...(phone && { phone }),
      },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        phone: true,
        avatar: true,
        bankName: true,
        bankAccountNumber: true,
        bankAccountName: true,
        commissionPercent: true,
      },
    });

    return NextResponse.json({ operator: updatedOperator });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

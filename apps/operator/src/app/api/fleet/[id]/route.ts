import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pexjet/database";
import { verifyAuth, unauthorizedResponse } from "@/lib/auth";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const operator = await verifyAuth(request);
  if (!operator) return unauthorizedResponse();

  try {
    const { id } = params;

    // Verify ownership
    const fleetEntry = await prisma.operatorFleet.findUnique({
      where: { id },
    });

    if (!fleetEntry || fleetEntry.operatorId !== operator.id) {
      return NextResponse.json(
        { error: "Fleet entry not found" },
        { status: 404 },
      );
    }

    // Delete from fleet
    await prisma.operatorFleet.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Aircraft removed from fleet",
    });
  } catch (error) {
    console.error("Fleet delete error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

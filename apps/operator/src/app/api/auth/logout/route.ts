import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pexjet/database";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7);

      try {
        const decoded = jwt.verify(token, JWT_SECRET) as { id: string };

        // Clear refresh token
        await prisma.operator.update({
          where: { id: decoded.id },
          data: { refreshToken: null },
        });
      } catch {
        // Token invalid, but still return success
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ success: true });
  }
}

import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@pexjet/database";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export interface AuthOperator {
  id: string;
  email: string;
  username: string;
  fullName: string;
  phone: string;
}

export async function verifyAuth(
  request: NextRequest,
): Promise<AuthOperator | null> {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      type: string;
    };

    if (decoded.type !== "operator") {
      return null;
    }

    const operator = await prisma.operator.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        phone: true,
      },
    });

    return operator;
  } catch {
    return null;
  }
}

export function unauthorizedResponse() {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}

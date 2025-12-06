import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pexjet/database";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "your-refresh-secret";

export async function POST(request: NextRequest) {
  try {
    const { identifier, password } = await request.json();

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "Email/username and password are required" },
        { status: 400 },
      );
    }

    // Find operator by email or username
    const operator = await prisma.operator.findFirst({
      where: {
        OR: [
          { email: identifier.toLowerCase() },
          { username: identifier.toLowerCase() },
        ],
      },
    });

    if (!operator) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(
      password,
      operator.passwordHash,
    );

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    // Generate tokens
    const accessToken = jwt.sign(
      { id: operator.id, email: operator.email, type: "operator" },
      JWT_SECRET,
      { expiresIn: "1h" },
    );

    const refreshToken = jwt.sign(
      { id: operator.id, type: "operator" },
      JWT_REFRESH_SECRET,
      { expiresIn: "7d" },
    );

    // Store refresh token
    await prisma.operator.update({
      where: { id: operator.id },
      data: { refreshToken },
    });

    // Return operator data (without sensitive fields)
    const operatorData = {
      id: operator.id,
      email: operator.email,
      username: operator.username,
      fullName: operator.fullName,
      phone: operator.phone,
      avatar: operator.avatar,
    };

    return NextResponse.json({
      accessToken,
      refreshToken,
      operator: operatorData,
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

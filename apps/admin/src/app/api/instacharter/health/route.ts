import { NextRequest, NextResponse } from "next/server";
import {
  verifyAccessToken,
  extractTokenFromHeader,
  checkApiHealth,
} from "@pexjet/lib";

/**
 * GET /api/instacharter/health
 * Check InstaCharter API configuration and health
 */
export async function GET(request: NextRequest) {
  const token = extractTokenFromHeader(request.headers.get("authorization"));
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = verifyAccessToken(token);
  if (!payload) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  try {
    const health = await checkApiHealth();
    return NextResponse.json(health);
  } catch (error) {
    console.error("Health check failed:", error);
    return NextResponse.json(
      {
        configured: false,
        accessible: false,
        message: error instanceof Error ? error.message : "Health check failed",
      },
      { status: 500 },
    );
  }
}

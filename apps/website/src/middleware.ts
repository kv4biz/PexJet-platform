// apps/website/src/middleware.ts

import { NextRequest, NextResponse } from "next/server";
import { verifyExternalToken } from "@/lib/external-auth";

export function middleware(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/api/external/")) {
    return NextResponse.next();
  }

  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Authorization header required" }, { status: 401 });
  }

  const token = authHeader.replace("Bearer ", "");

  const isValid = verifyExternalToken(token);

  if (!isValid) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/external/:path*"],
};

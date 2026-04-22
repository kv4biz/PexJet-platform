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
  const payload = verifyExternalToken(token);

  if (!payload) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  }

  // Optional: forward project id
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-external-project-id", payload.sub);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// 🔥 IMPORTANT: limit middleware to only external routes
export const config = {
  matcher: ["/api/external/:path*"],
};

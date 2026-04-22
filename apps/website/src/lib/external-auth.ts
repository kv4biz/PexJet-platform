// apps/website/src/lib/external-auth.ts
import jwt from "jsonwebtoken";

export interface ExternalJwtPayload {
  sub: string; // external project id
  iat: number;
  exp: number;
}

export function verifyExternalToken(token: string): ExternalJwtPayload | null {
  try {
    const secret = process.env.EXTERNAL_API_SECRET;
    if (!secret) throw new Error("Missing EXTERNAL_API_SECRET");

    return jwt.verify(token, secret) as ExternalJwtPayload;
  } catch (err) {
    console.error("JWT verification failed:", err);
    return null;
  }
}

export function generateExternalToken(sub: string, expiresInHours = 24): string {
  const secret = process.env.EXTERNAL_API_SECRET;
  if (!secret) throw new Error("Missing EXTERNAL_API_SECRET");

  return jwt.sign(
    { sub },
    secret,
    { expiresIn: `${expiresInHours}h` }, // JWT handles exp automatically
  );
}

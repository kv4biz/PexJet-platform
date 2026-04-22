// apps/website/src/lib/external-auth.ts

export function verifyExternalToken(token: string): boolean {
  const secret = process.env.EXTERNAL_API_SECRET;

  if (!secret) {
    console.error("Missing EXTERNAL_API_SECRET");
    return false;
  }

  return token === secret;
}

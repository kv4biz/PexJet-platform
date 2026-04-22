import jwt from 'jsonwebtoken';

// JWT payload interface for external API
export interface ExternalJwtPayload {
  sub: string; // External project identifier
  iat: number; // Issued at
  exp: number; // Expires at
}

// Verify JWT token from Authorization header
export function verifyExternalToken(token: string): ExternalJwtPayload | null {
  try {
    const secret = process.env.EXTERNAL_API_SECRET;
    if (!secret) {
      console.error('EXTERNAL_API_SECRET not configured');
      return null;
    }

    const decoded = jwt.verify(token, secret) as ExternalJwtPayload;
    
    // Check if token is not expired
    if (decoded.exp && decoded.exp < Date.now() / 1000) {
      console.error('Token expired');
      return null;
    }

    return decoded;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

// Generate JWT token for external projects
export function generateExternalToken(sub: string, expiresInHours: number = 24): string {
  const secret = process.env.EXTERNAL_API_SECRET;
  if (!secret) {
    throw new Error('EXTERNAL_API_SECRET not configured');
  }

  const payload: ExternalJwtPayload = {
    sub,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (expiresInHours * 3600),
  };

  return jwt.sign(payload, secret, { expiresIn: `${expiresInHours}h` });
}

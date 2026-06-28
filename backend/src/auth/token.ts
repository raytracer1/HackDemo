import * as jose from 'jose';

const secret = () =>
  new TextEncoder().encode(process.env.AUTH_SECRET || 'fallback-secret');

const TOKEN_EXPIRY = '30d';

export interface TokenPayload {
  sub: string;
  email: string;
  name?: string;
  /** 'user' or 'worker' */
  role: 'user' | 'worker';
}

/**
 * Authenticate a request by Bearer token.
 * - If token matches WORKER_SECRET → returns worker payload.
 * - Otherwise, verifies as user API token → returns user payload.
 * - Returns null if neither matches.
 */
export async function authenticate(header: string | undefined): Promise<TokenPayload | null> {
  if (!header?.startsWith('Bearer ')) return null;
  const token = header.slice(7);
  if (!token) return null;

  // Check worker secret first
  const workerSecret = process.env.WORKER_SECRET;
  if (workerSecret && token === workerSecret) {
    return { sub: 'worker', email: 'worker@internal', role: 'worker' };
  }

  // Verify user API token
  return verifyApiToken(token);
}

/**
 * Create an API token for the given user.
 */
export async function createApiToken(user: { sub: string; email: string; name?: string }): Promise<string> {
  return new jose.SignJWT({
    sub: user.sub,
    email: user.email,
    name: user.name,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(secret());
}

/**
 * Verify a user API token and return the payload.
 */
export async function verifyApiToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jose.jwtVerify<Record<string, unknown>>(token, secret());
    if (!payload.sub || !payload.email) return null;
    return {
      sub: payload.sub as string,
      email: payload.email as string,
      name: payload.name as string | undefined,
      role: 'user',
    };
  } catch {
    return null;
  }
}

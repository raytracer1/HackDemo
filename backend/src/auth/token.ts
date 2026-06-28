import * as jose from 'jose';

const secret = () =>
  new TextEncoder().encode(process.env.AUTH_SECRET || 'fallback-secret');

const TOKEN_EXPIRY = '30d';

export interface TokenPayload {
  sub: string;   // user id
  email: string;
  name?: string;
}

/**
 * Create an API token for the given user.
 * Extension stores this and sends it as Authorization: Bearer <token>.
 */
export async function createApiToken(user: TokenPayload): Promise<string> {
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
 * Verify an API token and return the payload.
 * Returns null if invalid or expired.
 */
export async function verifyApiToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jose.jwtVerify<TokenPayload>(token, secret());
    if (!payload.sub || !payload.email) return null;
    return { sub: payload.sub, email: payload.email, name: payload.name };
  } catch {
    return null;
  }
}

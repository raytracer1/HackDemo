import type { AuthConfig } from '@auth/core';
import { skipCSRFCheck } from '@auth/core';
import Google from '@auth/core/providers/google';
import Credentials from '@auth/core/providers/credentials';
import { callbacks } from './callbacks.js';
import { verifyPassword } from './register.js';
import { query } from '../db/index.js';

// Public-facing base URL. Auth.js uses this to construct the OAuth callback URL
// and set cookies. In dev this points to the Vite dev server (with proxy).
// In production this should be the backend's own domain.
export const AUTH_URL =
  process.env.AUTH_URL || `http://localhost:${process.env.PORT || 3001}`;

// Is this a production deployment (HTTPS)?
const isProduction = AUTH_URL.startsWith('https://');

export const authConfig: AuthConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = (credentials as any).email as string;
        const password = (credentials as any).password as string;
        if (!email || !password) return null;

        const result = await query(
          `SELECT id, email, name, image, password_hash, email_verified FROM users WHERE email = $1 AND type = 'credentials'`,
          [email],
        );
        const row = result.rows?.[0];
        if (!row || !row.password_hash) return null;

        if (!verifyPassword(password, row.password_hash)) return null;
        if (!row.email_verified) return null;

        return { id: row.id, email: row.email, name: row.name, image: row.image };
      },
    }),
  ],
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  basePath: '/api/auth',
  pages: {
    signIn: '/login',
    signOut: '/',
    error: '/login',
    verifyRequest: '/login',
  },
  // SPA with cross-origin POST to /signin: CSRF cookie isn't available
  // because the browser hasn't visited the backend before login.
  // Safe for OAuth-only providers (state param prevents CSRF on callback).
  skipCSRFCheck,
  callbacks,

  // Same-origin cookies (API proxied through frontend, OAuth callback points to frontend)
  useSecureCookies: isProduction,
  cookies: {
    sessionToken: {
      options: {
        sameSite: 'lax',
        secure: isProduction,
      },
    },
  },
};

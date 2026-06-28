import type { AuthConfig } from '@auth/core';
import { skipCSRFCheck } from '@auth/core';
import Google from '@auth/core/providers/google';
import { callbacks } from './callbacks.js';

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
  ],
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  basePath: '/api/auth',
  // SPA with cross-origin POST to /signin: CSRF cookie isn't available
  // because the browser hasn't visited the backend before login.
  // Safe for OAuth-only providers (state param prevents CSRF on callback).
  skipCSRFCheck,
  callbacks,

  // Cross-domain cookie support (needed when frontend & backend are on different domains)
  useSecureCookies: isProduction,
  cookies: {
    sessionToken: {
      options: {
        // In production with separate frontend/backend domains, the session
        // cookie must be sent cross-origin, which requires SameSite=None.
        // In dev, Lax works fine because Vite proxy makes it same-origin.
        sameSite: isProduction ? 'none' : 'lax',
        secure: isProduction,
        // Auth.js defaults to __Host- prefix with SameSite=Lax, but for
        // SameSite=None we must drop the __Host- prefix (no Domain attr).
      },
    },
  },
};

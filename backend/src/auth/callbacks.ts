import type { AuthConfig } from '@auth/core';
import { query } from '../db/index.js';

const WELCOME_CREDITS = 0.5; // USD

/**
 * Ensure a user row exists for the given Google profile.
 * Returns the user row (id, credits, isNew).
 */
async function upsertUser(profile: {
  sub: string;
  email: string;
  name?: string | null;
  picture?: string | null;
}): Promise<{ id: string; credits: number; isNew: boolean }> {
  const existing = await query(`SELECT id, credits FROM users WHERE id = $1`, [profile.sub]);

  if (existing.rows && existing.rows.length > 0) {
    // Existing user — update profile info (name / image may have changed)
    await query(
      `UPDATE users SET name = $1, image = $2, updated_at = now() WHERE id = $3`,
      [profile.name || null, profile.picture || null, profile.sub],
    );
    const row = existing.rows[0];
    return {
      id: profile.sub,
      credits: parseFloat(row.credits) || 0,
      isNew: false,
    };
  }

  // New user — create with welcome credits
  await query(
    `INSERT INTO users (id, email, name, image, credits)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      profile.sub,
      profile.email,
      profile.name || null,
      profile.picture || null,
      WELCOME_CREDITS,
    ],
  );

  console.log(`🎉 New user "${profile.email}" — granted $${WELCOME_CREDITS}`);

  return { id: profile.sub, credits: WELCOME_CREDITS, isNew: true };
}

// ── Auth.js callbacks ──

export const callbacks: AuthConfig['callbacks'] = {
  /**
   * redirect: allow cross-origin redirects back to the frontend SPA.
   * By default, Auth.js only allows same-origin redirects.
   */
  redirect({ url, baseUrl }) {
    // Relative paths stay within the backend
    if (url.startsWith('/')) return `${baseUrl}${url}`;
    // Same origin is always allowed
    if (new URL(url).origin === baseUrl) return url;
    // Allow redirects to the frontend domain
    const frontendUrl = process.env.FRONTEND_URL;
    if (frontendUrl && new URL(url).origin === new URL(frontendUrl).origin) return url;
    // Fallback
    return baseUrl;
  },

  /**
   * signIn: called when a user authenticates with a provider.
   * We use it to upsert the user in our database.
   */
  async signIn({ profile }) {
    if (!profile?.email) {
      console.warn('signIn callback: no email in profile');
      return false;
    }

    try {
      // Cast: Google provider always gives us these fields
      await upsertUser({
        sub: (profile as any).sub || profile.email, // fallback
        email: profile.email,
        name: (profile as any).name || profile.email?.split('@')[0],
        picture: (profile as any).picture || null,
      });
      return true;
    } catch (err) {
      console.error('signIn callback error:', err);
      // Still allow sign-in even if DB write fails (user gets default session)
      return true;
    }
  },

  /**
   * jwt: enrich the JWT with our database user ID and credit balance.
   */
  async jwt({ token, trigger, profile }) {
    // On sign-in, look up the user and attach DB fields to the token
    if (trigger === 'signIn' || trigger === 'signUp') {
      const email = profile?.email || token.email;
      if (email) {
        try {
          const result = await query(`SELECT id, credits FROM users WHERE email = $1`, [email]);
          if (result.rows && result.rows.length > 0) {
            const row = result.rows[0];
            token.dbUserId = row.id;
            token.credits = parseFloat(row.credits) || 0;
          }
        } catch (err) {
          console.error('jwt callback error:', err);
        }
      }
    }

    // On subsequent calls, refresh credits from the database
    if (token.dbUserId && !trigger) {
      try {
        const result = await query(`SELECT credits FROM users WHERE id = $1`, [token.dbUserId]);
        if (result.rows && result.rows.length > 0) {
          token.credits = parseFloat(result.rows[0].credits) || 0;
        }
      } catch {
        // keep existing token value
      }
    }

    return token;
  },

  /**
   * session: expose credits to the frontend.
   */
  async session({ session, token }) {
    if (session.user) {
      (session.user as any).credits = token.credits ?? 0;
    }
    return session;
  },
};

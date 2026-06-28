import type { AuthConfig } from '@auth/core';
import { query } from '../db/index.js';

const WELCOME_CREDITS = 0.5; // USD

/**
 * Ensure a user row exists for the given Google profile.
 * Returns the user row (id, credits, isNew).
 * Uses email as the lookup key; generates our own UUID as primary key.
 */
async function upsertUser(profile: {
  email: string;
  name?: string | null;
  picture?: string | null;
}): Promise<{ id: string; credits: number; isNew: boolean }> {
  const existing = await query(`SELECT id, credits FROM users WHERE email = $1`, [profile.email]);

  if (existing.rows && existing.rows.length > 0) {
    // Existing user — update profile info
    const row = existing.rows[0];
    await query(
      `UPDATE users SET name = $1, image = $2, updated_at = now() WHERE id = $3`,
      [profile.name || null, profile.picture || null, row.id],
    );
    return {
      id: row.id,
      credits: parseFloat(row.credits) || 0,
      isNew: false,
    };
  }

  // New user — generate our own UUID, set type = 'google'
  const userId = crypto.randomUUID();
  await query(
    `INSERT INTO users (id, email, name, image, type, credits)
     VALUES ($1, $2, $3, $4, 'google', $5)`,
    [
      userId,
      profile.email,
      profile.name || null,
      profile.picture || null,
      WELCOME_CREDITS,
    ],
  );
  await query(
    `INSERT INTO transactions (id, user_id, type, amount, description)
     VALUES ($1, $2, 'welcome_bonus', $3, $4)`,
    [crypto.randomUUID(), userId, WELCOME_CREDITS, 'Welcome bonus for new sign-up'],
  );

  console.log(`🎉 New user "${profile.email}" — granted $${WELCOME_CREDITS}`);

  return { id: userId, credits: WELCOME_CREDITS, isNew: true };
}

// ── Auth.js callbacks ──

export const callbacks: AuthConfig['callbacks'] = {
  /**
   * redirect: allow cross-origin redirects back to the frontend SPA.
   * By default, Auth.js only allows same-origin redirects.
   */
  redirect({ url, baseUrl }) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    // Relative paths: redirect to frontend domain
    if (url.startsWith('/')) return `${frontendUrl}${url}`;
    // Same origin (backend): allowed
    if (new URL(url).origin === baseUrl) return url;
    // Frontend domain: allowed
    if (new URL(url).origin === new URL(frontendUrl).origin) return url;
    // Fallback
    return frontendUrl;
  },

  /**
   * signIn: called when a user authenticates with a provider.
   * We use it to upsert the user in our database.
   */
  async signIn({ profile, account }) {
    // Credentials provider: user already created via /register, just allow sign-in
    if (account?.provider === 'credentials') return true;

    // OAuth providers: upsert user from profile
    if (!profile?.email) {
      console.warn('signIn callback: no email in profile');
      return false;
    }

    try {
      await upsertUser({
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
      (session.user as any).id = token.dbUserId;
      (session.user as any).credits = token.credits ?? 0;
    }
    return session;
  },
};

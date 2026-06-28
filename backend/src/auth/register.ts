import crypto from 'crypto';
import { FastifyInstance } from 'fastify';
import { Resend } from 'resend';
import { query } from '../db/index.js';

const WELCOME_CREDITS = 0.5;
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const EMAIL_FROM = process.env.EMAIL_FROM || 'onboarding@resend.dev';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  const verify = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return hash === verify;
}

export { hashPassword, verifyPassword };

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (!resend) {
    console.warn('[Email] RESEND_API_KEY not configured, skipping send');
    return false;
  }
  try {
    const { error } = await resend.emails.send({
      from: `HackDemo <${EMAIL_FROM}>`,
      to,
      subject,
      html,
    });
    if (error) {
      console.error('[Email] Error:', error.message);
      return false;
    }
    console.log(`[Email] Sent "${subject}" to ${to}`);
    return true;
  } catch (err: any) {
    console.error('[Email] Error:', err.message);
    return false;
  }
}

export default async function registerRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/auth/register — email/password sign-up.
   */
  fastify.post('/api/auth/register', async (request, reply) => {
    const { email, password } = request.body as any;
    if (!email || !password) {
      return reply.status(400).send({ error: 'Email and password are required.' });
    }
    if (password.length < 8) {
      return reply.status(400).send({ error: 'Password must be at least 8 characters.' });
    }
    if (!/[A-Z]/.test(password)) {
      return reply.status(400).send({ error: 'Password must contain at least one uppercase letter.' });
    }
    if (!/[0-9]/.test(password)) {
      return reply.status(400).send({ error: 'Password must contain at least one number.' });
    }

    const existing = await query(`SELECT id FROM users WHERE email = $1`, [email]);
    if (existing.rows && existing.rows.length > 0) {
      return reply.status(409).send({ error: 'An account with this email already exists.' });
    }

    const userId = crypto.randomUUID();
    const pwHash = hashPassword(password);
    const verifyToken = crypto.randomBytes(32).toString('hex');

    await query(
      `INSERT INTO users (id, email, name, type, password_hash, verification_token, credits)
       VALUES ($1, $2, $3, 'credentials', $4, $5, $6)`,
      [userId, email, email.split('@')[0], pwHash, verifyToken, WELCOME_CREDITS],
    );
    await query(
      `INSERT INTO transactions (id, user_id, type, amount, description)
       VALUES ($1, $2, 'welcome_bonus', $3, $4)`,
      [crypto.randomUUID(), userId, WELCOME_CREDITS, 'Welcome bonus for new sign-up'],
    );

    // Send verification email
    const verifyUrl = `${FRONTEND_URL}/verify?token=${verifyToken}`;
    sendEmail(
      email,
      'Verify your HackDemo account',
      `<h2>Welcome to HackDemo!</h2><p>Click the link below to verify your email address:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
    );

    console.log(`🎉 New user "${email}" registered`);

    return reply.status(201).send({ ok: true, message: 'Registration successful. Please check your email to verify your account.' });
  });

  /**
   * GET /api/auth/verify?token=xxx — verify email.
   */
  fastify.get('/api/auth/verify', async (request, reply) => {
    const token = (request.query as any).token;
    if (!token) return reply.status(400).send({ error: 'Missing token.' });

    const result = await query(
      `UPDATE users SET email_verified = true, verification_token = NULL WHERE verification_token = $1 RETURNING id`,
      [token],
    );

    if (!result.rows?.length) {
      return reply.status(400).send({ error: 'Invalid or expired verification token.' });
    }

    return reply.redirect(`${FRONTEND_URL}/login?verified=1`);
  });
}

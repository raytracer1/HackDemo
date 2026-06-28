import pg from 'pg';
import { SignatureV4 } from '@aws-sdk/signature-v4';
import { Sha256 } from '@aws-crypto/sha256-js';
import { HttpRequest } from '@aws-sdk/protocol-http';

const { Client } = pg;

let client: pg.Client | null = null;
let cachedToken = '';
let tokenExpire = 0;

/**
 * Generate IAM auth token for DSQL (used as PostgreSQL password).
 */
export async function generateToken(): Promise<string> {
  const hostname = process.env.DB_HOST!;
  const region = process.env.AWS_REGION || 'us-east-1';

  const signer = new SignatureV4({
    service: 'dsql',
    region,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
    sha256: Sha256,
  });

  const req = new HttpRequest({
    method: 'GET',
    protocol: 'https:',
    hostname,
    path: '/',
    headers: { host: hostname },
    query: { Action: 'DbConnectAdmin' },
  });

  const signed = await signer.presign(req);

  const url = new URL(`${signed.protocol}//${signed.hostname}${signed.path}`);
  Object.entries(signed.query || {}).forEach(([k, v]) => {
    url.searchParams.set(k, v as string);
  });

  return `${hostname}/?${url.searchParams.toString()}`;
}

/**
 * Get cached token or generate a new one.
 */
async function getPassword(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpire) return cachedToken;

  cachedToken = await generateToken();
  tokenExpire = Date.now() + 14 * 60 * 1000;

  return cachedToken;
}

/**
 * Get a connected pg Client.
 */
export async function getClient(): Promise<pg.Client> {
  const password = await getPassword();

  if (client && !(client as any)._ended) return client;

  client = new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME || 'postgres',
    user: process.env.DB_USER || 'admin',
    password,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  await client.query(`
    CREATE TABLE IF NOT EXISTS demos (
      id TEXT PRIMARY KEY,
      title TEXT,
      status TEXT,
      steps JSONB,
      language TEXT DEFAULT 'English',
      demo_type TEXT DEFAULT 'product-demo',
      user_id TEXT,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    )
  `);

  // Add columns if table was created before these columns existed
  try { await client.query(`ALTER TABLE demos ADD COLUMN language TEXT DEFAULT 'English'`); } catch (_) {}
  try { await client.query(`ALTER TABLE demos ADD COLUMN demo_type TEXT DEFAULT 'product-demo'`); } catch (_) {}
  try { await client.query(`ALTER TABLE demos ADD COLUMN user_id TEXT`); } catch (_) {}

  // Users table (for Google OAuth sign-in)
  await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      name TEXT,
      image TEXT,
      credits DECIMAL(20,8) DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    )
  `);

  // Migrate credits column precision if table was created with DECIMAL(10,2)
  try {
    await client.query(`ALTER TABLE users ALTER COLUMN credits TYPE DECIMAL(20,8)`);
  } catch (_) {}

  return client;
}

/**
 * Execute a SQL query with parameters.
 */
export async function query(sql: string, params: any[] = []) {
  const c = await getClient();
  return c.query(sql, params);
}

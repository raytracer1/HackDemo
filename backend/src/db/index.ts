import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import fs from 'fs';
import * as schema from './schema.js';

const { Pool } = pg;

import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function getSslConfig(): pg.PoolConfig['ssl'] {
  const certPath = path.join(__dirname, '..', '..', 'global-bundle.pem');
  if (fs.existsSync(certPath)) {
    return {
      rejectUnauthorized: false,
      ca: fs.readFileSync(certPath, 'utf-8'),
    };
  }
  return { rejectUnauthorized: false };
}

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'hackdemo',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  ssl: process.env.DB_SSL === 'false' ? false : getSslConfig(),
  max: 10,
  idleTimeoutMillis: 30000,
});

export const db = drizzle(pool, { schema });
export { schema };

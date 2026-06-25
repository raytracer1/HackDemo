import 'dotenv/config';
import { query } from './index.js';

async function main() {
  try {
    const res = await query(`SELECT version()`);
    console.log('✅ Connected!');
    console.log('Version:', res.rows[0].version);

    await query(`
      CREATE TABLE IF NOT EXISTS demos (
        id TEXT PRIMARY KEY,
        title TEXT,
        status TEXT,
        steps JSONB,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      )
    `);
    console.log('✅ Table "demos" ready');
  } catch (err: any) {
    console.error('❌ Failed:', err.message);
  }
}

main();

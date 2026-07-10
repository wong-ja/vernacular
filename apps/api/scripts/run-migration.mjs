import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sqlPath = resolve(__dirname, '../../../db-init.sql');
const sql = readFileSync(sqlPath, 'utf-8');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('FATAL: DATABASE_URL environment variable is not set');
  process.exit(1);
}

async function migrate() {
  const { default: postgres } = await import('postgres');
  const sqlClient = postgres(DATABASE_URL, { max: 1 });

  try {
    console.log('Running database migration...');
    await sqlClient.unsafe(sql);
    console.log('Migration complete.');
  } finally {
    await sqlClient.end();
  }
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});

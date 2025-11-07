import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Ensure .env is loaded for DB connection
dotenv.config();

// Reuse existing pg client/pool and exec helper
import { exec } from '../src/db/index.js';

// Resolve project-relative paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

async function main() {
  // Path to the seed SQL file
  const seedPath = path.join(projectRoot, 'db', 'seed', '001_seed_todos.sql');

  if (!fs.existsSync(seedPath)) {
    console.error(`Seed file not found at: ${seedPath}`);
    process.exit(1);
  }

  // Read SQL contents
  const sql = fs.readFileSync(seedPath, 'utf8');

  if (!sql || sql.trim().length === 0) {
    console.error('Seed SQL file is empty.');
    process.exit(1);
  }

  console.log('Starting database seed for todos...');
  try {
    // Run as a single statement; file contains simple inserts with ON CONFLICT DO NOTHING
    await exec(sql);
    console.log('Seed completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err?.message || err);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Unexpected error during seed:', err?.message || err);
  process.exit(1);
});

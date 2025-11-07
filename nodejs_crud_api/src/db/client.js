import { Pool } from 'pg';
import config from '../config/env.js';

/**
 * Create a pg Pool using either a connection string (DATABASE_URL) or discrete
 * configuration values from src/config/env.js. This centralizes DB connectivity
 * and provides a small query helper to ensure parameterized queries are used.
 */

// Initialize Pool based on normalized config
let poolConfig = {};
if (config.database.connectionString) {
  poolConfig.connectionString = config.database.connectionString;
} else {
  // Fallback to discrete values if provided via getConfig validation
  const { host, port, user, password, database } = config.database;
  poolConfig = {
    host,
    port,
    user,
    password,
    database,
  };
}

// Create a single shared pool instance
export const pool = new Pool(poolConfig);

// Log pool-level errors to help diagnose unexpected disconnects
pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
});

// PUBLIC_INTERFACE
export async function query(text, params = []) {
  /**
   * Execute a parameterized SQL query using the shared pool.
   *
   * Parameters:
   * - text: string - SQL statement with placeholders ($1, $2, ...)
   * - params: any[] - values corresponding to placeholders
   *
   * Returns:
   * - pg.QueryResult
   */
  try {
    const start = Date.now();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    // Optional simple debug log; keep minimal to remain dependency-light.
    // Uncomment for verbose logging:
    // console.log('executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (err) {
    // Surface query details safely; do not print params to avoid sensitive data leaks
    console.error('Database query error:', { message: err.message, text });
    throw err;
  }
}

/**
 * Graceful shutdown for the pool to avoid hanging Node process and to release
 * DB connections cleanly. Hook into common process signals/events.
 */
async function shutdownPool(reason = 'unknown') {
  try {
    // console.log(`Shutting down PostgreSQL pool due to: ${reason}`);
    await pool.end();
  } catch (err) {
    console.error('Error while shutting down PostgreSQL pool:', err);
  }
}

// Handle standard termination signals
const signals = ['SIGINT', 'SIGTERM'];
signals.forEach((sig) => {
  process.on(sig, async () => {
    await shutdownPool(sig);
    process.exit(0);
  });
});

// Ensure pool closes on process exit (best effort)
process.on('exit', async () => {
  await shutdownPool('process exit');
});

// Capture unhandled promise rejections and uncaught exceptions to log and exit
process.on('unhandledRejection', async (reason) => {
  console.error('Unhandled Promise Rejection:', reason);
  await shutdownPool('unhandledRejection');
  process.exit(1);
});

process.on('uncaughtException', async (err) => {
  console.error('Uncaught Exception:', err);
  await shutdownPool('uncaughtException');
  process.exit(1);
});

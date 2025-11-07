import { query } from './client.js';

// PUBLIC_INTERFACE
export async function ping() {
  /**
   * Run a lightweight query to validate DB connectivity.
   *
   * Returns:
   * - { ok: boolean, row?: any }
   */
  const { rows } = await query('SELECT 1 as ok');
  const row = rows?.[0] ?? null;
  return { ok: row?.ok === 1, row };
}

// PUBLIC_INTERFACE
export async function exec(text, params = []) {
  /**
   * Execute a parameterized SQL statement and return the raw result.
   *
   * Parameters:
   * - text: string - SQL with $1, $2 placeholders
   * - params: any[] - corresponding parameter values
   *
   * Returns:
   * - pg.QueryResult
   */
  return query(text, params);
}

export default {
  ping,
  exec,
};

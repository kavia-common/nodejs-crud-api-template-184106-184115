import express from 'express';
import pkg from '../../package.json' assert { type: 'json' };
import { ping } from '../db/index.js';

/**
 * PUBLIC_INTERFACE
 * createHealthRouter
 * Creates an Express Router with health and readiness endpoints:
 * - GET /health: returns service status, version, and current time
 * - GET /health/db: pings the database using SELECT 1 to ensure connectivity
 *
 * Returns:
 *  express.Router
 */
export function createHealthRouter() {
  const router = express.Router();

  /**
   * PUBLIC_INTERFACE
   * GET /health
   * Returns basic application health.
   */
  router.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'nodejs-crud-api',
      version: pkg.version || '0.0.0',
      time: new Date().toISOString(),
    });
  });

  /**
   * PUBLIC_INTERFACE
   * GET /health/db
   * Performs a lightweight database readiness check via SELECT 1.
   * - 200 { status: 'ok', db: { ok: true, row } } on success
   * - 503 { status: 'error', error: 'DB_UNAVAILABLE', message } on failure
   */
  router.get('/health/db', async (_req, res) => {
    try {
      const result = await ping();
      const healthy = !!result?.ok;
      if (healthy) {
        return res.status(200).json({
          status: 'ok',
          db: { ok: true, row: result.row },
          time: new Date().toISOString(),
        });
      }
      return res.status(503).json({
        status: 'error',
        error: 'DB_UNAVAILABLE',
        message: 'Database ping returned unexpected result',
      });
    } catch (err) {
      // Avoid leaking sensitive details; return generic error and minimal info
      console.error('DB readiness check failed:', err?.message || err);
      return res.status(503).json({
        status: 'error',
        error: 'DB_UNAVAILABLE',
        message: 'Database is not reachable',
      });
    }
  });

  return router;
}

export default createHealthRouter;

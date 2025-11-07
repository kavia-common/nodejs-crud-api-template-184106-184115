import express from 'express';
import cors from 'cors';
import { registerSecurityAndLogging } from './middleware/security.js';
import { notFound, errorHandler } from './middleware/error.js';
import createIndexRouter from './routes/index.js';

/**
 * PUBLIC_INTERFACE
 * createApp
 * Create and configure an Express application instance.
 * - Applies security headers and request logging
 * - Applies CORS
 * - Enables JSON body parsing with sensible size limits
 * - Mounts composed routers
 * - Adds 404 and centralized error handlers
 *
 * Returns:
 *  Express.Application - configured app instance (without binding to a port)
 */
export function createApp() {
  const app = express();

  // 1) Security + logging first
  registerSecurityAndLogging(app);

  // 2) CORS
  app.use(cors());

  // 3) Body parsers with size limits
  // Limit JSON payloads to 1mb (adjustable via env if desired in future)
  app.use(express.json({ limit: '1mb' }));
  // Optionally support urlencoded forms with similar limit
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // 4) Routers
  // Mount composed index router under root; it internally mounts /health, /docs, /openapi.json and /api/todos
  app.use('/', createIndexRouter());

  // 5) 404 and error handlers (must be last)
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

export default createApp;

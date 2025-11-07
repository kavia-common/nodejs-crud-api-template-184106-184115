import express from 'express';
import cors from 'cors';
import { registerSecurityAndLogging } from './middleware/security.js';

/**
 * PUBLIC_INTERFACE
 * createApp
 * Create and configure an Express application instance.
 * - Applies security headers and request logging
 * - Applies CORS
 * - Enables JSON body parsing
 * - Mounts routers
 * - Adds 404 and centralized error handlers
 *
 * Returns:
 *  Express.Application - configured app instance (without binding to a port)
 */
export function createApp() {
  const app = express();

  // Register security and logging early to cover all routes, including errors
  registerSecurityAndLogging(app);

  // Middlewares
  // Keep CORS and JSON parsing properly ordered after security/logging
  app.use(cors());
  app.use(express.json());

  // Base router placeholder
  const router = express.Router();

  /**
   * PUBLIC_INTERFACE
   * GET /health
   * Health check endpoint.
   * Returns JSON with status and timestamp for uptime verification.
   */
  router.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'nodejs-crud-api',
      time: new Date().toISOString(),
    });
  });

  // Mount router at root
  app.use('/', router);

  // Mount API routes
  // Todos routes
  // Note: routes implement parameterized queries via models and include validation middleware.
  import todosRouter from './routes/todos.routes.js';
  app.use('/api/todos', todosRouter);

  // Docs routes: serves /docs and /openapi.json
  import createDocsRouter from './routes/docs.routes.js';
  app.use('/', createDocsRouter());

  // Centralized error/404 middleware must be registered after all routers
  import { notFound, errorHandler } from './middleware/error.js';

  // 404 for unmatched routes
  app.use(notFound);

  // Error handler (last)
  app.use(errorHandler);

  return app;
}

export default createApp;

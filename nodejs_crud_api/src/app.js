import express from 'express';
import cors from 'cors';

/**
 * PUBLIC_INTERFACE
 * createApp
 * Create and configure an Express application instance.
 * - Applies CORS
 * - Enables JSON body parsing
 * - Mounts base router with a health endpoint
 *
 * Returns:
 *  Express.Application - configured app instance (without binding to a port)
 */
export function createApp() {
  const app = express();

  // Middlewares
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

  return app;
}

export default createApp;

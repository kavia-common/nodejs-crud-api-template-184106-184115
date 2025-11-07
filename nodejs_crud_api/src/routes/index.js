import express from 'express';
import createHealthRouter from './health.routes.js';
import todosRouter from './todos.routes.js';
import createDocsRouter from './docs.routes.js';

/**
 * PUBLIC_INTERFACE
 * createIndexRouter
 * Compose and return the root and API sub-routers for the application.
 *
 * Structure:
 * - rootRouter ('/'):
 *    - GET /health, GET /health/db
 *    - GET /docs, GET /openapi.json
 * - apiRouter ('/api'):
 *    - /todos (CRUD)
 *
 * Returns:
 *  express.Router
 */
export function createIndexRouter() {
  const root = express.Router();
  const api = express.Router();

  // Health under root
  root.use('/', createHealthRouter());

  // Docs and OpenAPI under root
  root.use('/', createDocsRouter());

  // API subroutes (todos)
  api.use('/todos', todosRouter);

  // Mount /api under the root index router
  root.use('/api', api);

  return root;
}

export default createIndexRouter;

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * PUBLIC_INTERFACE
 * createDocsRouter
 * Creates an Express Router that serves the OpenAPI JSON at:
 * - GET /openapi.json
 * - GET /docs (simple help page with a link to /openapi.json)
 *
 * Returns:
 *  express.Router
 */
export function createDocsRouter() {
  const router = express.Router();

  // Resolve openapi file path relative to this file
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  // projectRoot/src/routes -> projectRoot
  const projectRoot = path.resolve(__dirname, '..', '..');
  const openapiPath = path.join(projectRoot, 'openapi', 'openapi.json');

  // Serve the JSON directly
  router.get(['/openapi.json'], (req, res) => {
    res.type('application/json');
    res.sendFile(openapiPath);
  });

  // Basic docs landing page with usage note
  router.get(['/docs'], (_req, res) => {
    res.type('text/html').send(`
      <!doctype html>
      <html lang="en">
        <head>
          <meta charset="utf-8"/>
          <meta name="viewport" content="width=device-width,initial-scale=1"/>
          <title>API Docs</title>
          <style>
            body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, 'Helvetica Neue', Arial, 'Noto Sans', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; margin: 2rem; color: #111827; background: #f9fafb; }
            .card { background: #fff; border: 1px solid #e5e7eb; border-radius: 0.75rem; padding: 1.25rem; max-width: 720px; box-shadow: 0 1px 2px rgba(0,0,0,0.04); }
            a { color: #2563EB; text-decoration: none; }
            a:hover { text-decoration: underline; }
            code { background: #f3f4f6; padding: 0.1rem 0.3rem; border-radius: 0.25rem; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>API Documentation</h1>
            <p>OpenAPI JSON is available at <a href="/openapi.json">/openapi.json</a>.</p>
            <p>Use this JSON in tools like Swagger UI, ReDoc, or Postman.</p>
            <h3>WebSocket/Real-time</h3>
            <p>This project does not expose WebSocket endpoints.</p>
          </div>
        </body>
      </html>
    `);
  });

  return router;
}

export default createDocsRouter;

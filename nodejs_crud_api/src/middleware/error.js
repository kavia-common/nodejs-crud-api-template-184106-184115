import express from 'express';

/**
 * PUBLIC_INTERFACE
 * notFound
 * Express middleware to handle unmatched routes and generate a 404 error.
 *
 * Behavior:
 * - Creates an Error with message "Not Found"
 * - Attaches status 404 and optional code 'NOT_FOUND'
 * - Forwards to next error handler
 */
export function notFound(req, res, next) {
  const err = new Error('Not Found');
  // attach status to be respected by the error handler
  err.status = 404;
  // optional application error code
  err.code = 'NOT_FOUND';
  next(err);
}

/**
 * PUBLIC_INTERFACE
 * errorHandler
 * Centralized Express error-handling middleware.
 *
 * Parameters:
 * - err: Error object (may contain .status, .code)
 * - req: Express.Request
 * - res: Express.Response
 * - next: Express.NextFunction (unused)
 *
 * Behavior:
 * - Logs minimal details to stderr (method, path, status, message)
 * - Sends JSON-only response of the form:
 *   {
 *     error: {
 *       message: string,
 *       code?: string
 *     }
 *   }
 * - Status code defaults to 500 if not provided on error
 */
export function errorHandler(err, req, res, next) {
  // Default to 500 if status not provided
  const status = Number.isInteger(err?.status) ? err.status : 500;

  // Minimal logging to avoid leaking sensitive info
  const method = req?.method || 'UNKNOWN';
  const path = req?.originalUrl || req?.url || 'UNKNOWN';
  const message = err?.message || 'Internal Server Error';
  const code = err?.code;

  // Write a concise log line
  // Note: Avoid logging request/response bodies or secrets
  console.error(
    JSON.stringify({
      level: 'error',
      type: 'http_error',
      status,
      code,
      method,
      path,
      message,
    })
  );

  const payload = {
    error: {
      message,
    },
  };
  if (code) {
    payload.error.code = code;
  }

  // Ensure JSON-only responses
  res.status(status).json(payload);
}

export default {
  notFound,
  errorHandler,
};

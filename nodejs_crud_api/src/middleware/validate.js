import { validationResult } from '../schemas/todo.schema.js';

/**
 * PUBLIC_INTERFACE
 * validate
 * Express middleware factory to validate request parts (body, params, query)
 * against a provided schema using the schema's validate method.
 *
 * Parameters:
 * - schema: { validate: (data) => { valid: boolean, errors?: Array<{ path:string, message:string }> } }
 * - target: 'body' | 'params' | 'query' (defaults to 'body')
 *
 * Behavior:
 * - On validation pass: calls next()
 * - On validation fail: responds 400 with { error: 'ValidationError', details: [...] }
 */
export function validate(schema, target = 'body') {
  return (req, res, next) => {
    try {
      const data = req[target] ?? {};
      const result = schema.validate(data);
      if (result.valid) {
        return next();
      }
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Request validation failed',
        details: result.errors || [],
      });
    } catch (err) {
      console.error('Validation middleware error:', err);
      return res.status(500).json({
        error: 'InternalServerError',
        message: 'An unexpected error occurred during validation',
      });
    }
  };
}

/**
 * PUBLIC_INTERFACE
 * validateIdParam
 * Middleware to validate numeric :id route parameter.
 */
export function validateIdParam(paramName = 'id') {
  return (req, res, next) => {
    const raw = req.params?.[paramName];
    const id = Number(raw);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        error: 'ValidationError',
        message: `Path parameter "${paramName}" must be a positive integer`,
        details: [{ path: paramName, message: 'must be a positive integer' }],
      });
    }
    // Normalize param to integer for downstream handlers
    req.params[paramName] = id;
    next();
  };
}

export default {
  validate,
  validateIdParam,
};

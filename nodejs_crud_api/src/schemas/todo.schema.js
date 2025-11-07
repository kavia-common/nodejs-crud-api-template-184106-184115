function isString(val) {
  return typeof val === 'string' || val instanceof String;
}
function isBoolean(val) {
  return typeof val === 'boolean';
}
function isNull(val) {
  return val === null;
}
function isUndefined(val) {
  return typeof val === 'undefined';
}

/**
 * Very small validation helper to avoid adding external deps.
 * Schema shape:
 * {
 *   fields: {
 *     name: { required?: boolean, type?: 'string'|'boolean', nullable?: boolean }
 *   },
 *   allowUnknown?: boolean (default true)
 * }
 */
function validateWithSchema(schema, data) {
  const errors = [];
  const allowUnknown = schema.allowUnknown !== false;

  // Required checks
  for (const [field, rules] of Object.entries(schema.fields || {})) {
    const value = data[field];
    const present = !isUndefined(value);
    if (rules.required && !present) {
      errors.push({ path: field, message: 'is required' });
      continue;
    }
    if (!present) continue;

    if (isNull(value) && rules.nullable) {
      continue;
    }

    if (rules.type === 'string' && !(isString(value))) {
      errors.push({ path: field, message: 'must be a string' });
    }
    if (rules.type === 'boolean' && !(isBoolean(value))) {
      errors.push({ path: field, message: 'must be a boolean' });
    }
  }

  // Unknown field handling
  if (!allowUnknown) {
    for (const key of Object.keys(data || {})) {
      if (!Object.prototype.hasOwnProperty.call(schema.fields || {}, key)) {
        errors.push({ path: key, message: 'is not allowed' });
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * PUBLIC_INTERFACE
 * validationResult
 * Exported helper, in case middleware wants direct access. Not strictly necessary,
 * but kept for potential reuse.
 */
export const validationResult = { validate: (schema, data) => validateWithSchema(schema, data) };

/**
 * PUBLIC_INTERFACE
 * createTodoSchema
 * Schema for POST /api/todos
 * - title: required string
 * - description: optional string or null
 * - completed: optional boolean
 */
export const createTodoSchema = {
  validate: (data) =>
    validateWithSchema(
      {
        allowUnknown: false,
        fields: {
          title: { required: true, type: 'string' },
          description: { required: false, type: 'string', nullable: true },
          completed: { required: false, type: 'boolean' },
        },
      },
      data
    ),
};

/**
 * PUBLIC_INTERFACE
 * putTodoSchema
 * Schema for PUT /api/todos/:id
 * - Replace entire resource with required fields:
 *   - title: required string
 *   - description: required string or null
 *   - completed: required boolean
 */
export const putTodoSchema = {
  validate: (data) =>
    validateWithSchema(
      {
        allowUnknown: false,
        fields: {
          title: { required: true, type: 'string' },
          description: { required: true, type: 'string', nullable: true },
          completed: { required: true, type: 'boolean' },
        },
      },
      data
    ),
};

/**
 * PUBLIC_INTERFACE
 * patchTodoSchema
 * Schema for PATCH /api/todos/:id
 * - Partial update: at least one of title, description, completed (types must match if present)
 */
export const patchTodoSchema = {
  validate: (data) => {
    const base = validateWithSchema(
      {
        allowUnknown: false,
        fields: {
          title: { required: false, type: 'string' },
          description: { required: false, type: 'string', nullable: true },
          completed: { required: false, type: 'boolean' },
        },
      },
      data
    );
    if (!base.valid) return base;

    const keys = Object.keys(data || {});
    if (keys.length === 0) {
      return {
        valid: false,
        errors: [{ path: 'body', message: 'must include at least one updatable field' }],
      };
    }
    return base;
  },
};

/**
 * PUBLIC_INTERFACE
 * listQuerySchema
 * Validate optional pagination parameters for GET /api/todos
 * Accepts ?limit and ?offset as strings that parse to integers.
 */
export const listQuerySchema = {
  validate: (data) => {
    const errors = [];
    if (!isUndefined(data.limit)) {
      const n = Number(data.limit);
      if (!Number.isInteger(n) || n <= 0) {
        errors.push({ path: 'limit', message: 'must be a positive integer' });
      }
    }
    if (!isUndefined(data.offset)) {
      const n = Number(data.offset);
      if (!Number.isInteger(n) || n < 0) {
        errors.push({ path: 'offset', message: 'must be a non-negative integer' });
      }
    }
    return { valid: errors.length === 0, errors };
  },
};

export default {
  createTodoSchema,
  putTodoSchema,
  patchTodoSchema,
  listQuerySchema,
  validationResult,
};

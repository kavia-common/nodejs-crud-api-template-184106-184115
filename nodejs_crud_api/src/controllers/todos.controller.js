import {
  insertTodo,
  getTodoById,
  listTodos,
  updateTodo,
  deleteTodo,
} from '../models/todo.model.js';

/**
 * Shared response helpers for consistency.
 */
function ok(res, data, status = 200) {
  return res.status(status).json({ data });
}
function created(res, data) {
  return res.status(201).json({ data });
}
function notFound(res, message = 'Resource not found') {
  return res.status(404).json({ error: 'NotFound', message });
}
function badRequest(res, message = 'Bad request', details = undefined) {
  return res.status(400).json({ error: 'BadRequest', message, details });
}
function serverError(res, err) {
  console.error('Controller error:', err);
  return res.status(500).json({ error: 'InternalServerError', message: 'An unexpected error occurred' });
}

/**
 * PUBLIC_INTERFACE
 * createTodoHandler
 * POST /api/todos
 * Body: { title: string, description?: string|null, completed?: boolean }
 * Returns 201 with created todo.
 */
export async function createTodoHandler(req, res) {
  try {
    const todo = await insertTodo(req.body);
    return created(res, todo);
  } catch (err) {
    return serverError(res, err);
  }
}

/**
 * PUBLIC_INTERFACE
 * listTodosHandler
 * GET /api/todos?limit&offset
 * Returns 200 with array of todos
 */
export async function listTodosHandler(req, res) {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const offset = req.query.offset ? Number(req.query.offset) : undefined;
    const todos = await listTodos({ limit, offset });
    return ok(res, todos);
  } catch (err) {
    return serverError(res, err);
  }
}

/**
 * PUBLIC_INTERFACE
 * getTodoHandler
 * GET /api/todos/:id
 * Returns 200 with todo or 404 if not found
 */
export async function getTodoHandler(req, res) {
  try {
    const id = req.params.id;
    const todo = await getTodoById(id);
    if (!todo) return notFound(res, `Todo ${id} not found`);
    return ok(res, todo);
  } catch (err) {
    return serverError(res, err);
  }
}

/**
 * PUBLIC_INTERFACE
 * putTodoHandler
 * PUT /api/todos/:id
 * Full update (replace)
 * Returns 200 with updated todo or 404 if not found
 */
export async function putTodoHandler(req, res) {
  try {
    const id = req.params.id;
    // For PUT, we ensure all fields are considered; updateTodo handles dynamic update
    const next = await updateTodo(id, {
      title: req.body.title,
      description: Object.prototype.hasOwnProperty.call(req.body, 'description') ? req.body.description : null,
      completed: req.body.completed,
    });
    if (!next) return notFound(res, `Todo ${id} not found`);
    return ok(res, next);
  } catch (err) {
    return serverError(res, err);
  }
}

/**
 * PUBLIC_INTERFACE
 * patchTodoHandler
 * PATCH /api/todos/:id
 * Partial update
 * Returns 200 with updated todo or 404 if not found
 */
export async function patchTodoHandler(req, res) {
  try {
    const id = req.params.id;
    const allowed = {};
    if (Object.prototype.hasOwnProperty.call(req.body, 'title')) allowed.title = req.body.title;
    if (Object.prototype.hasOwnProperty.call(req.body, 'description')) allowed.description = req.body.description;
    if (Object.prototype.hasOwnProperty.call(req.body, 'completed')) allowed.completed = req.body.completed;

    const next = await updateTodo(id, allowed);
    if (!next) return notFound(res, `Todo ${id} not found`);
    return ok(res, next);
  } catch (err) {
    return serverError(res, err);
  }
}

/**
 * PUBLIC_INTERFACE
 * deleteTodoHandler
 * DELETE /api/todos/:id
 * Returns 204 on success, 404 if not found
 */
export async function deleteTodoHandler(req, res) {
  try {
    const id = req.params.id;
    const removed = await deleteTodo(id);
    if (!removed) return notFound(res, `Todo ${id} not found`);
    return res.status(204).send();
  } catch (err) {
    return serverError(res, err);
  }
}

export default {
  createTodoHandler,
  listTodosHandler,
  getTodoHandler,
  putTodoHandler,
  patchTodoHandler,
  deleteTodoHandler,
};

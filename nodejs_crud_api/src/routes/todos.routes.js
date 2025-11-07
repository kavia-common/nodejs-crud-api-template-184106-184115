import express from 'express';
import {
  createTodoHandler,
  listTodosHandler,
  getTodoHandler,
  putTodoHandler,
  patchTodoHandler,
  deleteTodoHandler,
} from '../controllers/todos.controller.js';
import { validate, validateIdParam } from '../middleware/validate.js';
import {
  createTodoSchema,
  putTodoSchema,
  patchTodoSchema,
  listQuerySchema,
} from '../schemas/todo.schema.js';

const router = express.Router();

// GET /api/todos - list with optional pagination
router.get('/', (req, res, next) => {
  const result = listQuerySchema.validate(req.query || {});
  if (!result.valid) {
    return res.status(400).json({
      error: 'ValidationError',
      message: 'Query validation failed',
      details: result.errors,
    });
  }
  return listTodosHandler(req, res, next);
});

// POST /api/todos - create
router.post('/', validate(createTodoSchema, 'body'), createTodoHandler);

// GET /api/todos/:id - read one
router.get('/:id', validateIdParam('id'), getTodoHandler);

// PUT /api/todos/:id - replace
router.put('/:id', validateIdParam('id'), validate(putTodoSchema, 'body'), putTodoHandler);

// PATCH /api/todos/:id - partial update
router.patch('/:id', validateIdParam('id'), validate(patchTodoSchema, 'body'), patchTodoHandler);

// DELETE /api/todos/:id - delete
router.delete('/:id', validateIdParam('id'), deleteTodoHandler);

export default router;

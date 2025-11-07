import { exec } from '../db/index.js';

/**
 * PUBLIC_INTERFACE
 * createTodosTableIfNotExists
 * Idempotently ensures the "todos" table exists with the required schema.
 * This is useful for local development when migrations haven't been run yet.
 */
export async function createTodosTableIfNotExists() {
  const sql = `
    CREATE TABLE IF NOT EXISTS todos (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NULL,
      completed BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    -- Ensure updated_at auto-updates on row modification (Postgres trigger)
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at_todos'
      ) THEN
        CREATE OR REPLACE FUNCTION set_updated_at_todos()
        RETURNS TRIGGER AS $func$
        BEGIN
          NEW.updated_at = now();
          RETURN NEW;
        END;
        $func$ LANGUAGE plpgsql;
      END IF;

      IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'trigger_set_updated_at_todos'
      ) THEN
        CREATE TRIGGER trigger_set_updated_at_todos
        BEFORE UPDATE ON todos
        FOR EACH ROW EXECUTE FUNCTION set_updated_at_todos();
      END IF;
    END$$;
  `;
  await exec(sql);
}

/**
 * PUBLIC_INTERFACE
 * insertTodo
 * Insert a new todo.
 * Parameters:
 * - data: { title: string, description?: string|null, completed?: boolean }
 * Returns the created row.
 */
export async function insertTodo(data) {
  const { title, description = null, completed = false } = data;
  const sql = `
    INSERT INTO todos (title, description, completed)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;
  const params = [title, description, completed];
  const { rows } = await exec(sql, params);
  return rows[0] ?? null;
}

/**
 * PUBLIC_INTERFACE
 * getTodoById
 * Fetch a todo by its ID.
 */
export async function getTodoById(id) {
  const { rows } = await exec('SELECT * FROM todos WHERE id = $1;', [id]);
  return rows[0] ?? null;
}

/**
 * PUBLIC_INTERFACE
 * listTodos
 * List todos with simple pagination.
 * Parameters:
 * - opts?: { limit?: number, offset?: number }
 */
export async function listTodos(opts = {}) {
  const limit = Number.isInteger(opts.limit) && opts.limit > 0 ? opts.limit : 50;
  const offset = Number.isInteger(opts.offset) && opts.offset >= 0 ? opts.offset : 0;
  const sql = `SELECT * FROM todos ORDER BY id DESC LIMIT $1 OFFSET $2;`;
  const { rows } = await exec(sql, [limit, offset]);
  return rows;
}

/**
 * PUBLIC_INTERFACE
 * updateTodo
 * Partially update a todo. Only provided fields will be updated.
 * Parameters:
 * - id: number
 * - data: { title?: string, description?: string|null, completed?: boolean }
 * Returns the updated row or null if not found.
 */
export async function updateTodo(id, data) {
  // Build dynamic UPDATE statement based on provided fields
  const sets = [];
  const params = [];
  let idx = 1;

  if (Object.prototype.hasOwnProperty.call(data, 'title')) {
    sets.push(`title = $${idx++}`);
    params.push(data.title);
  }
  if (Object.prototype.hasOwnProperty.call(data, 'description')) {
    sets.push(`description = $${idx++}`);
    params.push(data.description);
  }
  if (Object.prototype.hasOwnProperty.call(data, 'completed')) {
    sets.push(`completed = $${idx++}`);
    params.push(!!data.completed);
  }

  if (sets.length === 0) {
    // Nothing to update
    return await getTodoById(id);
  }

  // updated_at handled by trigger, but we set explicitly too for robustness
  sets.push(`updated_at = now()`);

  const sql = `
    UPDATE todos
    SET ${sets.join(', ')}
    WHERE id = $${idx}
    RETURNING *;
  `;
  params.push(id);

  const { rows } = await exec(sql, params);
  return rows[0] ?? null;
}

/**
 * PUBLIC_INTERFACE
 * deleteTodo
 * Delete a todo by ID. Returns true if a row was deleted.
 */
export async function deleteTodo(id) {
  const { rowCount } = await exec('DELETE FROM todos WHERE id = $1;', [id]);
  return rowCount > 0;
}

export default {
  createTodosTableIfNotExists,
  insertTodo,
  getTodoById,
  listTodos,
  updateTodo,
  deleteTodo,
};

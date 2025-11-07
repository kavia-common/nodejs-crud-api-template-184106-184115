-- Migration: Create todos table
-- Safe to run multiple times due to IF NOT EXISTS checks

CREATE TABLE IF NOT EXISTS todos (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger to auto-update updated_at on row update
CREATE OR REPLACE FUNCTION set_updated_at_todos()
RETURNS TRIGGER AS $func$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$func$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_set_updated_at_todos'
  ) THEN
    CREATE TRIGGER trigger_set_updated_at_todos
    BEFORE UPDATE ON todos
    FOR EACH ROW EXECUTE FUNCTION set_updated_at_todos();
  END IF;
END$$;

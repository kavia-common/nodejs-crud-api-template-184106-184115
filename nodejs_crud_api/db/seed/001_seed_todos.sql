-- Seed: Example todos
INSERT INTO todos (title, description, completed) VALUES
('Buy groceries', 'Milk, bread, eggs, and fruit', false),
('Read a book', 'Finish last 3 chapters', false),
('Clean workspace', 'Organize desk and cables', true)
ON CONFLICT DO NOTHING;

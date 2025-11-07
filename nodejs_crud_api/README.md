# Node.js CRUD API (Express + PostgreSQL)

This container provides a boilerplate Express server wired for PostgreSQL, intended as a starting template for building REST APIs with full CRUD operations (e.g., a Todo resource).

Note: The previous scaffold included a FastAPI placeholder; this project replaces it with an Express + pg setup.

## Features

- Express server with CORS and dotenv
- PostgreSQL client via `pg`
- Scripts for development (nodemon) and production
- Environment-driven configuration

## Requirements

- Node.js >= 18
- A running PostgreSQL database or connection string

## Environment Variables

Copy `.env.example` to `.env` and update values for your environment.

Required:
- `PORT` (default: 3001)
- `DATABASE_URL` (e.g., `postgres://user:password@host:5432/dbname`)

Optional (if you prefer discrete values instead of `DATABASE_URL`):
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`

## Getting Started

1. Install dependencies:
   - `npm install`

2. Create your environment file:
   - `cp .env.example .env`
   - Update values in `.env`

3. Run database migrations (PostgreSQL):
   - Using connection string (preferred):
     - `psql "$DATABASE_URL" -f db/migrations/001_create_todos.sql`
   - Or using discrete values:
     - `PGHOST=$DB_HOST PGPORT=$DB_PORT PGUSER=$DB_USER PGPASSWORD=$DB_PASSWORD psql -d $DB_NAME -f db/migrations/001_create_todos.sql`

   Optional: seed sample data
   - `psql "$DATABASE_URL" -f db/seed/001_seed_todos.sql`

4. Start the server in development (auto-reload):
   - `npm run dev`

5. Start the server in production:
   - `npm start`

The server entrypoint is `src/server.js`. You can implement routes and database access under `src/` (e.g., `src/routes`, `src/db`, `src/controllers`, `src/models`). This template includes:
- Health check route at GET `/health`
- Database pool in `src/db/`
- Todo SQL helpers in `src/models/todo.model.js`
- SQL migration in `db/migrations/001_create_todos.sql`
- Optional seed data in `db/seed/001_seed_todos.sql`

## Scripts

- `npm run dev` — start with nodemon (watches file changes)
- `npm start` — start with Node.js

## Dependencies

- `express` — web framework
- `cors` — Cross-Origin Resource Sharing middleware
- `dotenv` — load environment variables from `.env`
- `pg` — PostgreSQL client

Dev Dependencies:
- `nodemon` — development watcher

## Project Structure (suggested)

```
nodejs_crud_api/
├─ src/
│  ├─ server.js           # App entrypoint (create Express app, apply middlewares, start server)
│  ├─ routes/             # Express routers (e.g., todos.js)
│  ├─ controllers/        # Route handlers
│  ├─ db/                 # Database client / pool setup
│  └─ models/             # SQL helpers or query modules
├─ .env.example
├─ .gitignore
├─ package.json
└─ README.md
```

## Notes

- Do not commit a real `.env` file.
- When you add the database pool, ensure it reads from `DATABASE_URL` or the individual DB_* variables.
- Consider adding security/logging middlewares like `helmet` and `morgan` later if needed.

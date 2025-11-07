# Node.js CRUD API (Express + PostgreSQL)

An Express + pg boilerplate for building REST APIs with full CRUD operations (includes a Todo example).

Note: The earlier scaffold included a FastAPI placeholder; this project runs Express with PostgreSQL via `pg`.

## Features
- Express server with CORS and dotenv
- PostgreSQL client via `pg`
- Simple built-in security and access logs (no external helmet/morgan required)
- Environment-driven configuration
- OpenAPI JSON and docs landing page

## Requirements
- Node.js >= 18
- A running PostgreSQL database or connection string

## Environment Variables
Create `.env` from the example and set values for your environment.

Required (one of the following approaches):
1) Single connection string:
- DATABASE_URL=postgres://user:password@host:5432/dbname

OR

2) Discrete values (all required if you do not use DATABASE_URL):
- DB_HOST=localhost
- DB_PORT=5432
- DB_NAME=yourdb
- DB_USER=youruser
- DB_PASSWORD=yourpassword

Optional:
- PORT=3001 (default: 3001)

Steps:
- cp .env.example .env
- Edit .env and set the variables above.

## Install dependencies
- npm install

Dependencies used by the code:
- express
- cors
- dotenv
- pg

Dev dependency:
- nodemon

## Database migrations and seed
Run the migration to create the todos table:

Using connection string (psql):
- psql "$DATABASE_URL" -f db/migrations/001_create_todos.sql

Using discrete values (psql):
- PGHOST=$DB_HOST PGPORT=$DB_PORT PGUSER=$DB_USER PGPASSWORD=$DB_PASSWORD psql -d $DB_NAME -f db/migrations/001_create_todos.sql

Seed sample data:
- Using npm (recommended; uses existing pg client and .env):
  - npm run db:seed
- Or via psql:
  - psql "$DATABASE_URL" -f db/seed/001_seed_todos.sql

## Start the server
Development (auto-reload):
- npm run dev
Production:
- npm start

Entrypoint: src/server.js
- App factory: src/app.js

## Health and Docs Endpoints
- GET /health — basic service info
- GET /health/db — database connectivity check
- GET /openapi.json — OpenAPI v3 JSON
- GET /docs — docs landing with link to OpenAPI

Use Swagger UI:
- https://petstore.swagger.io/ → paste your server URL + /openapi.json
Example: http://localhost:3001/openapi.json

## Todo CRUD Endpoints (examples)
Base path: /api/todos

- List todos
  GET /api/todos?limit=50&offset=0
  Response: { "data": [ { "id": 1, "title": "...", ... } ] }

- Create todo
  POST /api/todos
  Body:
  {
    "title": "Buy groceries",
    "description": "Milk, bread, eggs",
    "completed": false
  }
  Response (201): { "data": { ...new todo... } }

- Get one
  GET /api/todos/1
  Response: { "data": { "id": 1, ... } }

- Replace (PUT)
  PUT /api/todos/1
  Body:
  {
    "title": "New title",
    "description": "May be null",
    "completed": true
  }
  Response: { "data": { ...updated todo... } }

- Update (PATCH)
  PATCH /api/todos/1
  Body (any subset):
  {
    "completed": true
  }
  Response: { "data": { ...updated todo... } }

- Delete
  DELETE /api/todos/1
  Response: 204 No Content

Validation errors return:
{
  "error": "ValidationError",
  "message": "Request validation failed",
  "details": [ ... ]
}

## Project Structure (overview)
nodejs_crud_api/
├─ src/
│  ├─ server.js            # Start server
│  ├─ app.js               # Create Express app
│  ├─ routes/              # Routers: health, docs, todos
│  ├─ controllers/         # Route handlers
│  ├─ db/                  # Database client/pool
│  ├─ models/              # SQL helpers (todos)
│  ├─ schemas/             # Minimal validation helpers
├─ db/
│  ├─ migrations/001_create_todos.sql
│  └─ seed/001_seed_todos.sql
├─ openapi/openapi.json
├─ package.json
└─ README.md

## Notes
- Do not commit your real .env.
- The code doesn’t depend on external `helmet` or `morgan`; minimal security headers and access logs are built-in.
- If you add `helmet` or `morgan` in the future, install them and wire them in `src/middleware/security.js` or `src/app.js`.

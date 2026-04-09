# API (Fastify)

**Node.js 20+** is required (see `package.json` `engines`).

Bootstrapped with [Fastify-CLI](https://www.npmjs.com/package/fastify-cli) / create-fastify (`plugins/`, `routes/`, `@fastify/autoload`).

## REST (todos)

The API uses a **single locked prefix** **`/todos`** (see `routes/todos/index.js` and `@fastify/autoload`). Non-2xx JSON errors use **`{ "error": { "code", "message", "details?" } }`**.

| Method | Path | Notes |
| ------ | ---- | ----- |
| **GET** | `/todos` | **200** `{ "todos": [ … ] }` — camelCase, **ISO 8601 UTC** dates; ordered by `createdAt` ascending. |
| **POST** | `/todos` | Body `{ "text": string }` (**1..10000**); **201** full todo; **400** validation envelope. |
| **PATCH** | `/todos/:id` | Body `{ "completed": boolean }` only; **200** full todo; **400** / **404** (`TODO_NOT_FOUND`, including invalid id shape). |
| **DELETE** | `/todos/:id` | **204** empty body; **404** same as PATCH. |

### OpenAPI (contract)

- **`NODE_ENV=production`:** OpenAPI routes are **disabled** (no spec/UI surface).
- **Otherwise:** Machine-readable spec at **`GET /documentation/json`** (used in CI contract smoke tests).
- **`NODE_ENV=development`:** **Swagger UI** at **`/documentation`** (same JSON under `/documentation/json` via `@fastify/swagger-ui`).

The generated document may list collection paths with a **trailing slash** (e.g. `/todos/`); HTTP clients should use the prefix above. Schemas for todos and the error envelope are driven from route JSON Schema (`schemas/todos-contract.js`).

### CORS

When **`CORS_ORIGIN`** is set (see `.env.example`, e.g. Vite `http://localhost:5173`), **`@fastify/cors`** allows that **single origin**. If unset, the CORS plugin is not registered (no `*` default).

## Persistence (SQLite + Drizzle)

- **Env:** `DATABASE_PATH` — path to the SQLite file (see `.env.example`, e.g. `./data/todos.db`).
- **Schema:** `db/schema.js` — table `todos` with snake_case columns; timestamps stored as **integer Unix epoch milliseconds** (API stories map JSON to **ISO 8601 UTC**).
- **Migrations:** versioned SQL under `migrations/` (generated via Drizzle Kit).

### First-time / new clone

1. Copy `.env.example` to `.env` if you have not already.
2. Ensure the parent directory for `DATABASE_PATH` exists, or let the migrator create it (`db/index.js` / `scripts/migrate.js` call `fs.mkdirSync(..., { recursive: true })` on the DB file’s parent).
3. From **`api/`**, run migrations. `scripts/migrate.js` loads **`api/.env`** when that file exists; otherwise set `DATABASE_PATH` in the environment. Relative `DATABASE_PATH` values resolve against the **`api/`** directory (aligned with `drizzle.config.js`), not the shell’s current working directory.

   ```bash
   npm run db:migrate
   ```

### Changing the schema

1. Edit `db/schema.js`.
2. Generate SQL:

   ```bash
   npm run db:generate
   ```

   (`drizzle-kit generate` — uses `drizzle.config.js`.)

3. Commit new files under `migrations/` (and `migrations/meta/`).
4. Apply on each environment: `npm run db:migrate`.

### `drizzle-kit push` vs migrations

- **Use `generate` + `migrate`** for anything that must be reproducible (production, CI, shared dev databases).
- **`drizzle-kit push`** is acceptable only for **local throwaway** SQLite files when you explicitly accept schema drift and non-versioned history. Do **not** rely on `push` alone for production or CI.

### `better-sqlite3` (native module)

Installs use **prebuilt binaries** when available for your platform. If install or CI fails to compile, ensure a supported Node version (≥ 20) and platform toolchain per [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) (Epic 2.4 may add dedicated CI steps).

## Available Scripts

| Script            | Description                                      |
| ----------------- | ------------------------------------------------ |
| `npm run dev`     | Dev server (watch).                              |
| `npm start`       | Production mode.                                 |
| `npm run test`    | Node test runner (`test/**/*.test.js`). Uses **`--test-concurrency=1`** so suites that set `DATABASE_PATH` do not race across files. |
| `npm run test:integration` | **`NODE_ENV=test`** — runs `test/integration/**/*.test.js` only (CI uses this). |
| `npm run lint`    | ESLint.                                          |
| `npm run db:generate` | Emit SQL from `db/schema.js` (`drizzle-kit`). |
| `npm run db:migrate`  | Apply migrations to the DB at `DATABASE_PATH`.   |

## DB module (`db/index.js`)

Single entry for opening SQLite (`better-sqlite3`), wrapping with Drizzle, and **`applyMigrations`**. Story **2.2** can import `createDb()` / `applyMigrations` as needed; this story does **not** run migrations at HTTP startup — run `npm run db:migrate` (or call `applyMigrations` from your bootstrap) before serving.

## Learn More

To learn Fastify, see the [Fastify documentation](https://fastify.dev/docs/latest/).

# Story 2.2: List and create todos via REST with validation and integration tests

Status: done

<!-- Ultimate context engine analysis completed - comprehensive developer guide created -->

## Story

As a **client application** (Sam),
I want **`GET` (list)** and **`POST` (create)** todos with **consistent JSON** and **clear validation errors**,
so that **the UI can load and add tasks reliably** (**FR17–FR19**, **FR22**).

## Blockers and order

- **Complete Story 2.1 first** (or land its outputs in the same branch before calling this done): `todos` table, Drizzle schema, migrations, and a working `DATABASE_PATH` workflow. This story assumes **migrated SQLite** and **Drizzle access patterns** from 2.1 exist.
- There is **no** prior implementation-artifact file for **2-1** in the repo yet; use **`_bmad-output/planning-artifacts/epics.md`** (Story 2.1 AC) as the contract for what the DB layer must provide.

## Acceptance Criteria

1. **Given** a running API with database migrated per Story 2.1  
   **When** the client **`GET`s** the list endpoint using the **single locked path prefix** (**`/todos`** *or* **`/api/todos`** — choose **one** in this story, document it in code comments and any interim README note; OpenAPI formalization is Story 2.4)  
   **Then** the response is **JSON** with **camelCase** todo fields and **`createdAt` / `updatedAt`** as **ISO 8601 UTC** strings  
   **And** the list is wrapped in a **keyed** envelope (**`{ "todos": [...] }`**) for forward compatibility, unless you explicitly document and test a different contract (architecture prefers keyed object) [Source: `_bmad-output/project-context.md`, `architecture.md`]

2. **Given** a valid **create** payload (non-empty todo **text** within documented bounds)  
   **When** the client **`POST`s** to the same prefix (e.g. **`POST /todos`** or **`POST /api/todos`**)  
   **Then** the todo is **persisted** in SQLite and the response returns the **full** todo entity including stable **`id`**, **`text`**, **`completed`** (boolean), **`createdAt`**, **`updatedAt`**  
   **And** **`updatedAt`** is set on create (same instant as **`createdAt`** is acceptable for the first version) per NFR on mutating fields [Source: `_bmad-output/project-context.md` — Critical Don't-Miss Rules]

3. **Given** an **invalid** body (e.g. **missing `text`**, **empty `text`**, **text over max length**, or pathological payload)  
   **When** the client **`POST`s**  
   **Then** the API responds **400** with the **standard error envelope**: `{ "error": { "code", "message", "details?" } }`  
   **And** the response does **not** leak stack traces or internal messages suitable for attack planning (**NFR-S3**) [Source: `epics.md` Additional Requirements, `architecture.md`]

4. **Given** integration test setup  
   **When** tests run (e.g. **`npm test`** in **`api/`** extended to include integration, or a dedicated script if you split runners)  
   **Then** **`api/test/integration/`** contains tests using **real HTTP** via **`fastify.inject`** (or equivalent) against an **isolated test SQLite file** (or documented ephemeral DB), with **migrations/schema applied** the same way as production/docs  
   **And** coverage includes: **happy list** (empty and/or with rows), **happy create**, **validation failure → 400** with error envelope [Source: `epics.md` Story 2.2, `architecture.md` — API integration tests]

5. **Given** server-side failures or validation rejections  
   **Then** **FR25** is respected: **Pino** (or the scaffold’s structured logger) records useful context (**`reqId`**, route, relevant ids where applicable) to **stdout/stderr** without echoing abusive payloads at **info** level [Source: `epics.md`, `project-context.md`]

## Tasks / Subtasks

- [x] **Lock REST prefix and route module** (AC: #1–3)  
  - [x] Add **`api/routes/todos.js`** (or **`todos/index.js`** if using nested route folders) matching **existing autoload** layout under `api/routes/` [Source: `api/app.js`, `architecture.md` — Structure Patterns]  
  - [x] Register **GET** (list) and **POST** (create) only; defer **PATCH**/**DELETE** to Story 2.3  
  - [x] Document chosen prefix in a short comment at top of the route file

- [x] **Wire persistence** (AC: #1–2)  
  - [x] Reuse **Drizzle + `todos` table** from Story 2.1 (`api/db/` per architecture); map **snake_case** columns ↔ **camelCase** JSON  
  - [x] **GET**: return all todos ordered deterministically (e.g. **`created_at` ASC**); document choice  
  - [x] **POST**: insert row, set **`completed`** default **false**, set **`created_at` / `updated_at`** per schema

- [x] **HTTP boundary validation** (AC: #3)  
  - [x] Use **Fastify JSON Schema** on the **POST** body (architecture: JSON Schema at boundary)  
  - [x] Define a **reasonable `maxLength`** for **`text`** (PRD: NFR-S1 — pick a concrete number, e.g. 1–10k chars, and keep DB column compatible)  
  - [x] Map validation failures to **400** + **`error.code`** (e.g. **`VALIDATION_ERROR`**) + human-readable **`message`**; optional **`details`** for field-level hints

- [x] **Integration tests** (AC: #4)  
  - [x] Create **`api/test/integration/`** if missing  
  - [x] Add a **test app builder** pattern: build Fastify app with **`DATABASE_PATH`** pointing at a **temp file**, run **migrations** (or documented schema apply) before tests, **unlink/close** after suite if needed  
  - [x] Tests: **GET** empty list → `{ todos: [] }`; **POST** valid → **201** or **200** (pick one, stay consistent with later OpenAPI); **GET** returns new row; **POST** invalid → **400** + envelope  
  - [x] Use **`fastify.inject`**; assert **status**, **JSON shape**, and **persistence** across sequential calls within a test

- [x] **Logging** (AC: #5)  
  - [x] Ensure validation and unexpected paths log appropriately; avoid logging full abusive bodies at info

- [x] **Scripts**  
  - [x] Extend **`api/package.json`** so **`npm test`** runs **unit** tests **and** **`api/test/integration/*`** (or add **`test:integration`** and document running both locally). Story **2.4** adds the **dedicated CI job** for API integration tests; until then, local + doc is acceptable per epic split.

## Dev Notes

### Technical requirements

- **Stack:** Fastify 5, `@fastify/autoload`, Node **≥ 20** — see `api/package.json`. No OpenAPI/CORS CI gate in this story (Story **2.4**).  
- **JSON:** **camelCase** only in API bodies/responses; dates **ISO 8601 UTC**.  
- **Errors:** Single envelope `{ error: { code, message, details? } }` for **all** non-2xx JSON errors in this story’s routes.  
- **Statuses:** **400** validation; reserve **404** for Story 2.3; **500** only for unexpected server errors with generic client message.

### Architecture compliance

- Single prefix **`/todos`** or **`/api/todos`** — **never** both.  
- Table **`todos`**, physical columns **snake_case**; Drizzle **`columnName`** mapping as in `architecture.md` / `project-context.md`.  
- Integration tests live under **`api/test/integration/`** with **isolated DB** per run or suite.  
- Reuse existing **`api/test/helper.js`** (`buildApplication` from `fastify-cli/helper`) where possible; you may need to pass **opts** (e.g. env or plugin options) so **`DATABASE_PATH`** is test-specific.

### Library and dependencies

- Story 2.1 should add **`better-sqlite3`**, **`drizzle-orm`**, **`drizzle-kit`**; this story may add **`@fastify/swagger`** only if you need it early — **optional**; contract hardening is **2.4**.  
- Prefer **Fastify JSON Schema** for request validation; shared **Zod** is optional per architecture.

### File structure (expected touches)

| Area | Path |
|------|------|
| Routes | `api/routes/todos/index.js` (autoload prefix `/todos`; top-level `todos.js` would collide with `root.js` on `GET /`) |
| DB access | `api/db/*` (from 2.1 — extend with list/insert helpers if useful) |
| Integration tests | `api/test/integration/todos-list-create.test.js` (name as you prefer) |
| Test helper | Extend `api/test/helper.js` or add `api/test/integration/setup.js` for DB + build |

### Testing requirements

- **Minimum:** three scenarios — list (happy), create (happy), create (validation error).  
- Prefer **Node’s built-in test runner** (`node --test`) to match current `api/package.json` **`test`** script unless the team standardizes on Vitest for `api/` in an earlier change.  
- Assertions: HTTP status, parsed JSON, and **second request** sees persisted data after create.

### Previous story intelligence

- **Story 2.1** file not present under `implementation-artifacts/`; treat **`epics.md` § Story 2.1** as source of truth for schema (`id`, `text`, `completed`, `created_at`, `updated_at`, future **`user_id`** compatibility).  
- **Epic 1** left **`api/`** as create-fastify scaffold: `app.js`, `routes/root.js`, `routes/example/`, `plugins/*`, `test/helper.js` — match **kebab-case / autoload** naming already in use.

### Latest technical notes

- **`fastify.inject`** is the recommended way to exercise routes without a live port (Fastify 5 docs).  
- Ensure **better-sqlite3** native binding works in CI when Story 2.4 wires API tests into GitHub Actions (ubuntu-latest + `npm ci`).

### Project context reference

- Read **`_bmad-output/project-context.md`** before coding; it restates **camelCase JSON**, **error envelope**, **GET `{ todos: [] }`**, **`updatedAt` on mutations**, and **anti-patterns** (mixed prefixes, snake_case JSON).

## Dev Agent Record

### Agent Model Used

Composer (Cursor agent)

### Debug Log References

- `@fastify/autoload` does not apply a filename-based prefix for sibling `routes/*.js` files; only **subdirectories** get `dirNameRoutePrefix`. `routes/todos.js` + `routes/root.js` both registered `GET /` → **FST_ERR_DUPLICATED_ROUTE**. Resolved with **`routes/todos/index.js`** → prefix `/todos`.

### Implementation Plan

- `plugins/database.js`: open SQLite, `applyMigrations`, `decorate('db')`, close on shutdown.
- `plugins/error-envelope.js`: global `setErrorHandler` → `{ error: { code, message, details? } }`; **400** + **warn** for validation; **500** generic body + **error** log.
- `routes/todos/index.js`: **GET /** → `{ todos }` ordered by `createdAt` ASC; **POST /** JSON Schema `text` 1–10k, **201** + full entity, ISO UTC dates.
- `test/helper.js`: temp `DATABASE_PATH` + cleanup per test context.
- Integration: `test/integration/todos-list-create.test.js` — empty list, create+list persistence, empty/missing/maxLength validation.

### Completion Notes List

- AC1–5 satisfied: `/todos`, camelCase + ISO dates, **201** on create, **400** + envelope, `npm test` includes integration, Pino validation at **warn** without body echo at info.
- Full suite: `api/npm test` (9 tests) and `api/npm run lint` green.

### File List

- `api/README.md`
- `api/package.json`
- `api/plugins/database.js`
- `api/plugins/error-envelope.js`
- `api/routes/todos/index.js`
- `api/test/helper.js`
- `api/test/integration/todos-list-create.test.js`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/2-2-list-and-create-todos-via-rest-with-validation-and-integration-tests.md`

### Review Findings

- [x] [Review][Patch] Add interim REST note for locked prefix — AC1 asks to document the chosen path in code comments **and** an interim README note; `api/README.md` covers persistence but not **`GET/POST /todos`**. [_bmad-output/implementation-artifacts/2-2-list-and-create-todos-via-rest-with-validation-and-integration-tests.md — AC1] — fixed: **REST (todos) — interim** section in `api/README.md`.
- [x] [Review][Patch] Serialize API tests or stop using global `DATABASE_PATH` — `api/test/helper.js` assigns `process.env.DATABASE_PATH` while Node’s test runner may run **multiple test files in parallel** (Node's default test file concurrency is greater than one unless overridden), so concurrent suites can race and point the DB plugin at the wrong file. Prefer `npm test` with `--test-concurrency=1` or pass the DB path via Fastify options instead of mutating `process.env`. [api/test/helper.js, api/package.json] — fixed: **`npm test`** runs with **`--test-concurrency=1`**; README scripts table documents why.

## Change Log

- **2026-04-09:** Code review patches — `api/README.md` interim REST `/todos` table; `api/package.json` `npm test` uses `--test-concurrency=1` to avoid `DATABASE_PATH` races across test files.
- **2026-04-09:** Story 2.2 implemented — REST list/create at `/todos`, Drizzle persistence, JSON Schema validation, error envelope plugin, integration tests, test helper temp DB.

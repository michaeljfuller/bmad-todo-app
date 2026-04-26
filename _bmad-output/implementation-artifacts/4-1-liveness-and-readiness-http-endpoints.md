# Story 4.1: Liveness and readiness HTTP endpoints

Status: review

<!-- Ultimate context engine analysis completed - comprehensive developer guide created -->

## Story

As an **operator** (Jordan),
I want **`GET /health`** and **`GET /ready`** on the API,
so that **orchestrators and Compose can tell when the service and DB are actually usable** (**FR24**).

## Acceptance Criteria

1. **Liveness — `GET /health`** — Given the API process is **running and accepting HTTP**, when an operator (or load balancer) calls **`GET /health`**, then the response is **2xx** with a **minimal, non-sensitive** JSON body (e.g. status flag only). **Must not** require a working database connection (process-only check). [Source: `_bmad-output/planning-artifacts/epics.md` — Story 4.1; `architecture.md` — Health & operability]
2. **Readiness — `GET /ready`** — Given the API is running, when **`GET /ready`** is called, then it returns **2xx** **only if** **SQLite is reachable** and the app can exercise the persistence layer in a way that proves **migrations/schema expectations** are satisfied (e.g. trivial query against the **`todos`** table or equivalent schema probe after migrations). If the DB is unavailable or the probe fails, return **503** (or another clearly non-ready **5xx**) with **no** file paths, connection strings, or stack traces in the payload—align with project error JSON shape where practical (`{ "error": { "code", "message" } }` per `project-context.md`). [Source: `epics.md` Story 4.1; `architecture.md` — readiness definition]
3. **Safe for orchestrators** — Response bodies for both routes are **safe for load balancers / Compose logs** (no secrets, no internal paths). [Source: `epics.md` Story 4.1]
4. **Automated tests** — **Integration or focused route tests** (using **`fastify.inject`** and the existing **`api/test/helper.js`** `build` pattern with isolated `DATABASE_PATH`) assert: **`/health`** returns success without depending on DB failure injection unless you add a dedicated test harness; **`/ready`** returns success with a healthy migrated test DB; **`/ready`** returns **not ready** when persistence is broken (e.g. separate test that builds an app instance where the DB probe fails—choose one maintainable approach: mock `fastify.db`, temp DB removed before ready check, or invalid `DATABASE_PATH` if the route is registered before failure—**document the chosen approach** in a short code comment). [Source: `epics.md` Story 4.1; `architecture.md` — API integration tests]

## Prerequisites

- **Epic 2** complete: Fastify app, **`plugins/database.js`** opens SQLite, **`applyMigrations`** on startup, **`fastify.db`** (Drizzle) available on routes that run after the database plugin. [Source: `api/plugins/database.js`, `api/db/index.js`]
- **Epic 4 Stories 4.2–4.4** will wire **Dockerfile `HEALTHCHECK`** and **Compose `healthcheck:`** to these URLs—**this story only** defines the HTTP contract and tests; **do not** block on Docker files unless you need them for local verification (optional manual `curl` only).

## Tasks / Subtasks

- [x] **Implement `GET /health`** (AC: #1, #3)
  - [x] Add route in **`api/routes/root.js`** (Architecture places **`/health`** and **`/ready`** next to root routes) [Source: `architecture.md` — `api/routes/root.js` extend]
  - [x] Keep handler **free of `fastify.db`** access; return minimal JSON (e.g. `{ "status": "ok" }` or `{ "ok": true }`)—pick one and stay consistent with any future **web** static health wording
- [x] **Implement `GET /ready`** (AC: #2, #3)
  - [x] Use **`fastify.db`** (or the underlying SQLite handle if a thin probe is clearer) to run a **cheap** read (e.g. `SELECT 1` via Drizzle/sql or `limit(0)` pattern that still validates the table exists post-migration)
  - [x] On failure: **503** + safe message; log details at **warn/error** with **Pino** if not already covered by a global error handler—**never** leak `DATABASE_PATH` in JSON
- [x] **Tests** (AC: #4)
  - [x] Prefer **`api/test/integration/`** for inject-based contract tests alongside existing todo/OpenAPI tests, **or** extend **`api/test/routes/root.test.js`** if you keep scope small—**one convention**: integration folder is preferred for new **ops** endpoints mirroring **`todos-*.test.js`**
  - [x] Cover success paths for **`/health`** and **`/ready`** with **`build(t)`** from **`api/test/helper.js`** (already sets temp `DATABASE_PATH` and tears down)
  - [x] Cover at least **one** “not ready” path for **`/ready`**
- [x] **OpenAPI** (AC: #3, contract CI)
  - [x] Register **route schemas** (or manual OpenAPI path entries) for **`/health`** and **`/ready`** under **`@fastify/swagger`** so **`GET /documentation/json`** in **non-production** includes these paths (tests use `NODE_ENV=test` today—follow existing **`api/plugins/swagger.js`** behavior)
  - [x] Extend **`api/test/integration/openapi-contract.test.js`** (or adjacent test) to assert **`paths['/health']`** and **`paths['/ready']`** exist with **GET** and documented **2xx** / **503** as appropriate
- [x] **Postman** — Update **`api/postman/bmad-todo-api.postman_collection.json`** with **`GET /health`** and **`GET /ready`** requests so the contract matches the repo [Source: `_bmad-output/project-context.md` — API changes]

## Dev Notes

### Technical requirements

- **Fastify 5** + **`@fastify/autoload`** for `plugins/` and `routes/`—new routes belong in existing **`routes/root.js`** unless the team explicitly splits `health.js` (avoid duplicate route modules). [Source: `project-context.md` — Fastify file naming]
- **Plugin order:** **`/ready`** runs **after** the database plugin; if autoload order ever prevented DB decoration, fix order explicitly—today **`database.js`** loads from `plugins/` and **`root.js`** from `routes/`; confirm **`fastify.db`** exists before handling **`/ready`** (typical autoload: plugins before routes).
- **Liveness vs readiness:** **`/health`** must remain meaningful when DB is down (e.g. DB plugin throws on startup—then the process may not listen at all; that is acceptable). If DB plugin loads successfully but later queries fail, **`/health`** still **200**, **`/ready`** **503**—orchestrators rely on this split. [Source: `architecture.md` — Data flow: readiness checks DB]
- **REST prefix:** Todo API remains under **`/todos`**; health routes are **top-level** **`/health`** and **`/ready`** (not under `/api/todos`).

### Architecture compliance

- **FR24** — Operator can verify application and critical dependencies; **`GET /ready`** is the DB gate for Epic 4 Compose work later. [Source: `epics.md` — FR mapping]
- **Logging:** **Pino** to stdout; include **`reqId`** where the request context exists (Fastify default). [Source: `project-context.md`, `architecture.md`]
- **Future Epic 4.3:** Compose **`healthcheck:`** will call these endpoints—keep responses fast (no heavy queries).

### Library / framework requirements

- **Drizzle** + **better-sqlite3** (existing)—readiness probe uses the same stack as CRUD, not a second client.
- **Node test** + **`node:assert/strict`** + **`fastify.inject`**—match **`api/test/integration/*.test.js`** style.

### File structure requirements

| Area | Path |
|------|------|
| Routes | `api/routes/root.js` (extend; current stub only has `GET /`) |
| Integration tests | `api/test/integration/health-ready.test.js` (suggested) and/or `api/test/routes/root.test.js` |
| OpenAPI plugin | `api/plugins/swagger.js` — tags/paths if manual registration needed |
| Contract test | `api/test/integration/openapi-contract.test.js` |
| Postman | `api/postman/bmad-todo-api.postman_collection.json` |

### Testing requirements

- Use **`build`** from **`api/test/helper.js`** so each test run gets an **isolated** temp DB directory (same pattern as **`todos-list-create.test.js`**).
- Do **not** point tests at the developer’s **`api/data/todos.db`**.
- CI: existing **`api` test job** must stay green after adding tests.

### Previous story intelligence

- **Story 4.1** is the **first story in Epic 4**; there is no **`4-0-*`** artifact. **Epic 3 / Story 3.7** established **E2E** discipline (shared DB, **`workers: 1`**, route/unroute matcher stability)—this story does **not** require new Playwright specs unless you optionally smoke **`/health`** from E2E (defer unless requested; **integration tests are the acceptance bar** here). [Source: `_bmad-output/implementation-artifacts/3-7-end-to-end-trust-reload-server-alignment-and-error-journeys.md`]

### Git intelligence summary

- Workspace may not be a **git** checkout in all environments—no commit-based diff assumed; rely on file paths above.

### Latest technical information

- **Fastify `inject`:** Use `app.inject({ method: 'GET', url: '/ready' })` with async/await; status **`res.statusCode`**, parse **`res.json()`** when body is JSON.
- **503 semantics:** Common for readiness failure; aligns with proxy health check expectations.

### Project context reference

- Follow **`_bmad-output/project-context.md`** for **camelCase** JSON on public responses, **error envelope** on API errors where applicable, **Pino** logging, and **Postman** updates after route changes.

## Dev Agent Record

### Agent Model Used

Composer (Cursor agent)

### Debug Log References

### Completion Notes List

- Implemented **`GET /health`** → `{ "status": "ok" }` with no DB access; **`GET /ready`** → Drizzle `select().from(todos).limit(1)` with **503** + `{ error: { code: "NOT_READY", message: "Service is not ready" } }` on probe failure; **warn** log with `reqId` + err (no path leak in JSON).
- Added **`api/schemas/health-ready-contract.js`** route schemas; **`ops`** tag in **`api/plugins/swagger.js`**; integration tests **`api/test/integration/health-ready.test.js`** (`build(t)` + stub `app.db.select` throws for not-ready); extended **`openapi-contract.test.js`** for `/health` and `/ready` paths; Postman Root folder requests for **`GET /health`** / **`GET /ready`**.

### File List

- `api/routes/root.js`
- `api/schemas/health-ready-contract.js`
- `api/plugins/swagger.js`
- `api/test/integration/health-ready.test.js`
- `api/test/integration/openapi-contract.test.js`
- `api/postman/bmad-todo-api.postman_collection.json`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/4-1-liveness-and-readiness-http-endpoints.md`

## Change Log

- **2026-04-26** — Story 4.1: liveness **`GET /health`**, readiness **`GET /ready`**, OpenAPI + Postman + integration tests; sprint status **in-progress** → **review**.

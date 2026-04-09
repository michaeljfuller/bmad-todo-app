# Story 2.4: OpenAPI contract, CORS configuration, and CI job for API integration tests

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an **operator/developer**,
I want a **published OpenAPI spec** and **CI running integration tests** on every change,
so that **the API contract stays reviewable** and **regressions are caught automatically**.

## Acceptance Criteria

1. **OpenAPI accuracy** — Given all todo routes from **Stories 2.1–2.3** are implemented, when the API runs in **development** with Swagger/OpenAPI enabled (per Architecture), the generated **OpenAPI document** reflects **paths, methods, request/response schemas, HTTP statuses**, and the **standard error envelope** `{ "error": { "code", "message", "details?" } }`, including the **locked single path prefix** (`/todos` *or* `/api/todos`—whichever was chosen in 2.2) and the **single DELETE response convention** (204 *or* 200—chosen in 2.3).
2. **CORS from env** — CORS is applied via **`@fastify/cors`** (or equivalent Fastify-native approach) using **`CORS_ORIGIN`** from environment (`api/.env.example` already documents it). **Do not** ship a production default of `*` or reflective origin without an explicit, documented dev-only guard; local dev may allow the Vite origin (e.g. `http://localhost:5173`) via env.
3. **CI integration job** — `.github/workflows/ci.yml` gains a **dedicated job** (or clearly separated step sequence) that runs **API integration tests** on every PR/push to `main`/`master`, consistent with Architecture: install → run **`api`** integration test command (see Tasks). This **extends** the existing Epic 1 E2E job; both must pass independently.
4. **Logging (FR25)** — Integration-test failures and normal request handling remain compatible with **structured logging (Pino)** to **stdout**; no stack traces or internal details leak to clients on error responses.

## Prerequisites

- **Stories 2.1, 2.2, and 2.3** are assumed done: Drizzle/SQLite, full CRUD routes, `api/test/integration/` suite from those stories. This story **does not** redefine CRUD behavior; it **documents** it in OpenAPI, **secures browser access** with CORS, and **gates** the suite in CI.
- If any prior story is incomplete, finish it first or implement this story in the same branch only after the route surface exists.

## Tasks / Subtasks

- [x] **OpenAPI stack** (AC: #1, #4)
  - [x] Add **`@fastify/swagger`** and **`@fastify/swagger-ui`** (or current Fastify 5–compatible pair from npm) to `api/package.json`; register in a **`api/plugins/`** module (e.g. `swagger.js`) **conditionally** so UI is appropriate for **development** (Architecture: OpenAPI + UI in dev).
  - [x] Ensure **route schemas** (JSON Schema on routes or shared definitions) drive the spec: list, create, update completion, delete, **400** validation, **404** missing id, **error** response schema matching project-context.
  - [x] Expose **JSON OpenAPI** at a stable path (e.g. `/documentation/json` or framework default) for **contract review** / diff in PRs; document the URL in `api/README.md` briefly.
- [x] **CORS** (AC: #2)
  - [x] Register **`@fastify/cors`** reading **`process.env.CORS_ORIGIN`** (single origin string for v1 is fine; if multiple origins are needed later, document why). Align with **`api/.env.example`**.
  - [x] Verify browser preflight from Vite dev origin works when **`CORS_ORIGIN`** matches **`VITE_*`** API base host (see Architecture cross-component note).
- [x] **CI** (AC: #3)
  - [x] Add root or `api` script if needed, e.g. `test:integration` running only `api/test/integration/**` (or whatever pattern 2.2/2.3 established); CI must run migrations/test DB setup those tests require.
  - [x] Update **`.github/workflows/ci.yml`**: new job `api-integration` (name TBD) with `node-version: '20'`, `npm ci`, then run the integration test script for **`api`** workspace. Use **cache: npm** like the E2E job.
  - [x] Ensure CI env sets **`DATABASE_PATH`** (and **`CORS_ORIGIN`** if tests hit CORS) to safe temp paths/values so tests are isolated.
- [x] **Verification** (AC: all)
  - [x] Manually open Swagger UI in dev and confirm **DELETE** status and **path prefix** match implementation.
  - [x] Confirm CI job fails if a route is removed or response shape diverges from schema (smoke check).

## Dev Notes

### Technical requirements

- **Stack:** Fastify 5 (`api/package.json`), autoload for `plugins/` and `routes/` (`api/app.js`). Match **existing file naming** in those folders.
- **Contract:** OpenAPI is the **review surface** for API changes ([Source: `_bmad-output/project-context.md` — Testing Rules / Contract]).
- **Errors:** All non-2xx JSON errors use `{ "error": { "code", "message", "details?" } }` ([Source: `_bmad-output/project-context.md` — Critical Implementation Rules]).
- **JSON field casing:** `camelCase` in API; DB remains `snake_case` per Drizzle ([Source: `architecture.md` — Data architecture]).

### Architecture compliance

- OpenAPI from Fastify (**@fastify/swagger** family) — [Source: `_bmad-output/planning-artifacts/architecture.md` — Important Decisions / Documentation].
- CORS not wide open in production defaults; **`CORS_ORIGIN`** in API env — [Source: `architecture.md` — Configuration & NFR-S2].
- CI includes **API integration tests** alongside lint/typecheck/unit/build/E2E — [Source: `architecture.md` — CI / PR enforcement].
- Integration tests live under **`api/test/integration/`** with isolated SQLite — [Source: `architecture.md` — Project Structure].

### Library / framework requirements

- Prefer **`@fastify/swagger`** + **`@fastify/swagger-ui`** versions compatible with **`fastify@^5`**; verify on npm before pinning.
- **`@fastify/cors`** for CORS; configure via env, not hardcoded production `*`.

### File structure requirements

| Area | Path |
|------|------|
| App bootstrap | `api/app.js` |
| Plugins (swagger, cors) | `api/plugins/*.js` |
| Todo routes | `api/routes/...` (per 2.2/2.3 layout) |
| Integration tests | `api/test/integration/*` |
| Env template | `api/.env.example` (already lists `CORS_ORIGIN`) |
| CI | `.github/workflows/ci.yml` |
| Root orchestration | `package.json` workspaces — add script only if needed for CI clarity |

### Testing requirements

- **Do not** replace integration tests from 2.2/2.3; **ensure CI runs them** every PR.
- Optional: add one **lightweight test** that fetches **`/documentation/json`** (or chosen path) and asserts **required paths** exist if the team wants CI contract smoke without external tooling.

### Previous story intelligence

- **No** `implementation-artifacts` story files exist yet for Epic 2 (`2-1-*`, `2-2-*`, `2-3-*`). Treat **`_bmad-output/planning-artifacts/epics.md`** Stories **2.2** and **2.3** as the source of truth for route behavior, prefixes, DELETE convention, and integration test expectations.

### Project context reference

- Follow **`_bmad-output/project-context.md`** for REST prefix singularity, DELETE convention, error envelope, `updatedAt` rules, and anti-patterns (no second prefix, no snake_case JSON).

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Story 2.4]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — OpenAPI, CORS, CI, API integration tests, project tree]
- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 2 intro: OpenAPI as contract, PR/CI enforcement]
- [Source: `_bmad-output/project-context.md` — Full stack rules]

## Dev Agent Record

### Agent Model Used

GPT-5.2 (Cursor agent)

### Debug Log References

### Completion Notes List

- **OpenAPI:** `api/plugins/swagger.js` — `@fastify/swagger` for all non-`production` envs; `@fastify/swagger-ui` only when `NODE_ENV===development`. For `test`/unset (non-dev), **`GET /documentation/json`** is registered explicitly so CI does not duplicate swagger-ui’s route. Shared schemas + route `response`/`body` from `api/schemas/todos-contract.js`; **`/todos`** prefix and **DELETE 204** documented (generated paths may show `/todos/` trailing slash — noted in README).
- **CORS:** `api/plugins/cors.js` — registers `@fastify/cors` only when `CORS_ORIGIN` is non-empty (no `*` default).
- **Tests:** `test/integration/openapi-contract.test.js`, `test/integration/cors-preflight.test.js`; `npm run test:integration` sets `NODE_ENV=test`.
- **CI:** Job `api-integration` in `.github/workflows/ci.yml` with `DATABASE_PATH` under `runner.temp`, `CORS_ORIGIN` set.
- **Manual verification (AC):** With `api/.env` as in `.env.example` (`NODE_ENV=development`), open **`http://localhost:3000/documentation`** (or your `PORT`) and confirm **DELETE** shows **204** and **GET/POST** under **`/todos`**. Automated suite covers contract smoke (removing routes or breaking schemas fails tests).

### File List

- `api/package.json`
- `api/package-lock.json` (root workspace lockfile updated via install)
- `api/plugins/cors.js`
- `api/plugins/swagger.js`
- `api/schemas/todos-contract.js`
- `api/routes/todos/index.js`
- `api/test/integration/openapi-contract.test.js`
- `api/test/integration/cors-preflight.test.js`
- `api/README.md`
- `api/postman/bmad-todo-api.postman_collection.json`
- `.github/workflows/ci.yml`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Change Log

- 2026-04-09 — Story 2.4: OpenAPI (swagger + dev-only UI), env-based CORS, `test:integration`, CI `api-integration` job, contract + CORS integration tests, README and Postman contract request.

---

**Story completion status:** done — Code review clean (2026-04-09); integration suite green.

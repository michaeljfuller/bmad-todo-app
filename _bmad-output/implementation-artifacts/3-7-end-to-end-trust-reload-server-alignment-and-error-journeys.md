# Story 3.7: End-to-end trust — reload, server alignment, and error journeys

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want **reload to show the truth** and **errors to recover cleanly**,
so that **I trust this scratchpad** (**FR14**, **FR26**, **FR11–FR12**, edge journeys).

## Acceptance Criteria

1. **Reload = server truth** — Given a **populated** todo list loaded from the API (via UI or seed), when the user **reloads** the browser page, then the rendered list **matches persisted todos** from the API for that deployment (**FR14**, **FR26**). Ordering should match whatever the client already implements for list display (typically API order); the invariant is **no phantom rows** and **no missing rows** relative to `GET /todos`.
2. **Mutation failures are visible** — When a **mutation** (create, complete/uncomplete, or delete) **fails** (network error, **5xx**, or other handled API failure), the UI **does not silently remove or corrupt rows** (no “disappeared todo” without explanation). The user sees **actionable** feedback consistent with prior stories (**FR12**, **UX-DR5**)—e.g. inline/banner copy and **Retry** where appropriate—and the list remains consistent with **server state** after the error path (e.g. refetch or rollback of any optimistic UI).
3. **E2E coverage** — Playwright specs under **`e2e/tests/`** cover:
   - **Reload persistence**: after creating or seeding data, **full page reload**, then assert todos visible in the UI match expectations derived from the API (or from pre-reload UI assertions).
   - **At least one failure + recovery path** for **list load** or **mutation** (e.g. failed `GET /todos` then retry succeeds, or failed `POST`/`PATCH`/`DELETE` then user recovers)—aligned with Architecture’s **error handling** E2E bar [Source: `_bmad-output/planning-artifacts/architecture.md` — E2E minimum].
4. **Design reference hygiene** — **`_bmad-output/planning-artifacts/ux-design-directions.html`** stays **reference-only**; do not bundle it into the app runtime or treat it as a source of truth for code (**UX-DR11**).

## Prerequisites

- **Epic 2** API is available: **`/todos`** prefix, standard error envelope, SQLite persistence [Source: `api/routes/todos/index.js`, `api/test/integration/*`].
- **Stories 3.1–3.6** are expected to have delivered the **TodoApp** shell, **TanStack Query** list/mutations, **loading/error/retry** patterns, row actions, and accessibility/motion baseline. If any of those are incomplete, implement or stub the minimum UI hooks so this story’s E2E can run; do **not** re-scope full UX of earlier stories into this file.

## Tasks / Subtasks

- [x] **Reload persistence E2E** (AC: #1, #3)
  - [x] Add a Playwright spec (e.g. `e2e/tests/todo-reload-persistence.spec.ts`) that: starts from a **non-empty** list (seed via **`request` API** to `POST /todos` and/or UI flow—pick one consistent approach), captures **expected titles/ids or stable text**, performs **`page.reload()`**, waits for list ready, asserts **parity** with server (either re-query API with `request` and compare, or assert the same visible items as before reload).
  - [x] Use the **same** `DATABASE_PATH` for the API process for the whole test so reload does not cross a wiped DB.
- [x] **Failure + recovery E2E** (AC: #2, #3)
  - [x] Add a spec (same file or `todo-error-recovery.spec.ts`) that simulates failure (**`page.route` abort/500**, temporary **down API**, or route mock) for **GET /todos** or a **mutation** endpoint, asserts **user-visible** error affordance (banner/inline + **Retry** if that’s what the app provides), then restores success and asserts **recovery** (list loads or mutation completes without silent data loss).
  - [x] Explicitly assert **no unexplained empty list** when the server still holds todos (guards wrong optimistic update behavior).
- [x] **CI / orchestration** (AC: #3)
  - [x] Extend **`e2e/playwright.config.ts`** (and/or **`webServer`** / **`globalSetup`**) so CI’s **`npm run test:e2e`** runs the **real** client + API against an **isolated** SQLite file (e.g. under `os.tmpdir()` or workspace `.tmp` gitignored), with **`CORS_ORIGIN`** matching the page origin Playwright uses (see **`client/.env.example`** / **`api/.env.example`**).
  - [x] Ensure **`.github/workflows/ci.yml`** `e2e` job remains green: install browsers, run full suite including new specs (may need env vars for `DATABASE_PATH`, `CORS_ORIGIN`, `VITE_API_BASE_URL` in the job).
- [x] **Docs** (AC: #3, #4)
  - [x] Update **README** (short subsection): how to run **product E2E** locally (ports, env, one command), and that **`ux-design-directions.html`** is **not** part of the build.

### Review Findings

- [x] [Review][Patch] **`page.unroute` must use the same function reference** as `page.route` when the URL matcher is a function (`urlMatchesEqual` is `===` in Playwright). Replaced duplicate arrow predicates with a shared `matchTodosCollection` per test in **`e2e/tests/todo-error-recovery.spec.ts`** — fixed 2026-04-26.
- [x] [Review][Patch] **`workers: 1`** in **`e2e/playwright.config.ts`** — product E2E shares one SQLite file and one API; default multi-worker runs locally caused cross-spec DB races (CI was already `1`). — fixed 2026-04-26.

### Senior Developer Review (AI)

**Review date:** 2026-04-26  
**Outcome:** Approve  

#### Action Items

- [x] Playwright route/unroute matcher reference (`todo-error-recovery.spec.ts`).
- [x] E2E worker count for shared DB determinism (`e2e/playwright.config.ts`).

## Dev Notes

### Technical requirements

- **Server source of truth:** After successful mutations, list state must follow **Query cache + invalidation** (or equivalent) per **FR26**; reload must refetch and show DB-backed data [Source: `_bmad-output/project-context.md` — Server state / Query keys].
- **Errors:** Map API failures through **`mapApiError`** (or the single module introduced in 3.2); **never** show raw JSON/stack traces in UI [Source: `_bmad-output/project-context.md` — User-facing errors].
- **REST:** **`GET /todos`** returns **`{ "todos": [...] }`** with **camelCase** fields; mutations return full todo or **204** on DELETE per OpenAPI [Source: `api/test/integration/openapi-contract.test.js`].
- **E2E seeding:** Prefer Playwright **`request`** fixture hitting **`VITE_API_BASE_URL`** (or explicit test base URL) for deterministic setup; aligns with Architecture “may use request fixture for seeding” [Source: `_bmad-output/planning-artifacts/architecture.md` — Internal flows].

### Architecture compliance

- **E2E minimum bar** includes **error handling** with user-visible recovery [Source: `_bmad-output/planning-artifacts/architecture.md` — Testing / checklist ~lines 452–456].
- **CI** eventually includes Playwright against **compose or equivalent**; until **Epic 4** Compose is mandatory in CI, **`webServer`**-style orchestration for **api + static or dev client** is acceptable if documented and stable [Source: `architecture.md` — CI / E2E].
- **CORS:** API **`CORS_ORIGIN`** must allow the origin Playwright loads (e.g. `http://127.0.0.1:<vitePort>` or `localhost`—match exactly) [Source: `api/README.md`, Story 2.4 notes].

### Library / framework requirements

- **`@playwright/test`** (existing **`e2e/`** workspace) — use **`page.reload`**, **`request`**, **`page.route`** as needed; keep **`e2e/tests/smoke.spec.ts`** hermetic so smoke stays fast if you split jobs later.
- Do **not** add Cypress or a second E2E runner.

### File structure requirements

| Area | Path |
|------|------|
| Playwright config / webServer | `e2e/playwright.config.ts` |
| New specs | `e2e/tests/*.spec.ts` |
| Client (if small hooks needed for test ids) | `client/src/**` — prefer **`data-testid`** only where selectors would otherwise be brittle; keep minimal. |
| CI | `.github/workflows/ci.yml` |
| Reference-only UX | `_bmad-output/planning-artifacts/ux-design-directions.html` — **do not import** into `client/` |

### Testing requirements

- **Determinism:** Isolate **`DATABASE_PATH`** per test run; avoid sharing DB with developer’s local server.
- **Assertions:** Prefer stable selectors (roles, labels per **NFR-A2**) plus optional **`data-testid`** for list root and error banner.
- **Failure simulation:** Document chosen strategy (route mock vs stop server) in a comment at top of the spec file for future maintainers.

### Previous story intelligence

- **No implementation-artifact files** exist yet for **3-1–3-6** in `_bmad-output/implementation-artifacts/`; rely on **`_bmad-output/planning-artifacts/epics.md`** (Stories **3.2–3.6**) for loading/error/retry, double-submit, row actions, keyboard/motion, and prior E2E mentions (**list load**, **empty**, **add**, **complete/delete** journeys). This story **closes the loop** on **reload**, **server alignment**, and **explicit error journeys** called out in Epic 3.7.
- **Epic 2 retrospective** highlights aligning **`VITE_*`** with **`CORS_ORIGIN`** for contributor sanity—apply the same when wiring CI E2E [Source: `_bmad-output/implementation-artifacts/epic-2-retro-2026-04-09.md`].
- **Story 1.4** intentionally avoided **`baseURL`**; **product E2E** should set **`baseURL`** (or full URLs) to the served client for journey specs [Source: `_bmad-output/implementation-artifacts/1-4-playwright-e2e-scaffold-and-green-ci-job.md`].

### Project context reference

- Follow **`_bmad-output/project-context.md`** for Query usage, error mapping, JSON casing, and E2E expectations (**create**, **complete**, **delete**, **empty**, **error/recovery**).

### Latest technical notes (Playwright)

- Use current Playwright **webServer** array or documented **`globalSetup`** pattern for multi-process startup; ensure **graceful teardown** so CI runners do not leak processes.
- Re-read [Playwright CI](https://playwright.dev/docs/ci) if adjusting install or reporter flags.

## Dev Agent Record

### Agent Model Used

Composer (Cursor agent)

### Debug Log References

### Completion Notes List

- Implemented Story 3.7: reload parity E2E (`todo-reload-persistence.spec.ts`), GET/POST error recovery (`todo-error-recovery.spec.ts`) with `page.route` + `isTodosCollectionUrl` helper; aligned GET failure count with app `QueryClient` `retry: 1` (two aborted GETs before banner).
- Default E2E DB path moved to gitignored `.tmp/e2e-stack.db` via `scripts/e2e-dev-stack.sh`; CI already used `${{ runner.temp }}/bmad-e2e.db`.
- `QueryErrorBanner`: `data-testid="todo-list-error-banner"` for stable E2E selectors.
- README: product E2E checklist + `ux-design-directions.html` reference-only note; `e2e/playwright.config.ts`: env documentation block.
- Code review (2026-04-26): shared `matchTodosCollection` for `route`/`unroute`; `workers: 1` for shared SQLite + single API determinism.

### File List

- `e2e/tests/todo-reload-persistence.spec.ts`
- `e2e/tests/todo-error-recovery.spec.ts`
- `e2e/helpers/clearAllTodos.ts`
- `e2e/playwright.config.ts`
- `scripts/e2e-dev-stack.sh`
- `client/src/todos/QueryErrorBanner.tsx`
- `README.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/3-7-end-to-end-trust-reload-server-alignment-and-error-journeys.md`

## Change Log

- 2026-04-26 — Story 3.7 implementation: reload + error recovery E2E, isolated default E2E DB, README/playwright env docs, list error `data-testid`.
- 2026-04-26 — Code review: Playwright `unroute` matcher identity + `workers: 1`; story marked **done**.


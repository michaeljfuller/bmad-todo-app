---
stepsCompleted:
  - 1
  - 2
  - 3
  - 4
  - 5
  - 6
  - 7
  - 8
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
workflowType: architecture
project_name: bmad-todo-app
user_name: Michael
date: '2026-04-08'
lastStep: 8
status: complete
completedAt: '2026-04-08'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**

The PRD defines **26 functional requirements** that imply a **small but strict** system boundary: a **single-list** todo experience with **create, read, update (complete/incomplete), and delete**, plus **creation time** and clear **active vs completed** presentation. The client must support **empty, loading, and error** states for both **initial load** and **mutations**, with **recoverable** outcomes (e.g. retry) and **no silent corruption** of the user’s mental model. **Duplicate submission** must be mitigated so flaky networks do not produce duplicate todos. **Cross-session continuity** is required for the **same deployment** (single logical dataset, no accounts in v1). **Keyboard-only** completion of core actions, **visible focus**, and sensible structure for assistive tech are explicit. On the server side, the system must **persist** todos, expose **interpretable validation failures**, return **missing-resource** semantics when appropriate, and support **operator** concerns via **health/readiness** and **reviewable diagnostics** for failures. **FR26** locks in **eventual consistency with the server**: after a successful data refresh, the UI matches persisted todos for that deployment.

**Non-Functional Requirements:**

**Performance (NFR-P1–P3):** Core mutations must show **user-visible acknowledgment within about one second** under typical conditions, or show **loading/pending** rather than an idle void; initial list area must show **loading immediately**; UI must not **lock up** during routine single mutations. **Reliability (NFR-R1–R2):** Successful writes must remain **durable across API process restart** under documented storage configuration; concurrency expectations are **low**, single-dataset, not multi-tenant scale. **Security (NFR-S1–S3):** **Bounded input** to limit abuse/corruption; **TLS** for non-local production; **user-facing errors** stay generic while **operators** get richer signals in logs. **Accessibility (NFR-A1–A2):** Meets PRD baseline for keyboard, focus, and semantics; full WCAG audit is explicitly **not** a v1 gate unless added later. **Scalability (NFR-SC1):** Design must stay **compatible with future per-user or multi-tenant growth** without a **complete rewrite** of the **core todo model** (mechanism deferred).

**Scale & Complexity:**

- **Primary domain:** Full-stack **web application** — SPA-oriented client consuming a **JSON HTTP API** with **durable persistence**.
- **Complexity level:** **Low** per PRD classification, with **notable engineering emphasis** on **API contracts, UI honesty under failure, and durability** — treat as **low–medium** for architecture planning (few features, high bar on correctness and polish).
- **Estimated architectural components (logical):** **Browser client** (list UI, mutation flows, state handling), **HTTP API** (CRUD + validation + error mapping), **persistence layer** (single logical store per deployment), **cross-cutting** concerns (logging, health, configuration for API base URL/CORS, deployment packaging/docs). Exact technology choices are **out of scope for this analysis step**.

### Technical Constraints & Dependencies

From the PRD and web-app section: **resource-oriented HTTP with JSON**; **CORS** and **environment-based API base URL**; **server authoritative** state with **optional optimistic UI** requiring **reconciliation**; **consistent JSON error shape** and stable **HTTP status** usage; **structured logging** for server failures; **health/readiness** for deploys and checks; **browser support** limited to current major browsers including **mobile Safari/Chrome**; **SPA (or single-route SPA)** preferred to avoid unnecessary full-page reloads; **no WebSockets** required for v1; **SEO low emphasis** (basic title/meta only). **Authentication, multi-user datasets, collaboration, priority/dates/notifications, and admin/support consoles** are **explicitly out of v1** but must not be **accidentally foreclosed** by data model or API boundaries.

### Cross-Cutting Concerns Identified

- **API contract stability:** CRUD mapping, error envelope, status codes, and idempotency/clarity where it affects duplicate or retry behavior.
- **Client state vs server truth:** Load paths, mutation paths, optimistic/pending UX, and refresh/retry without ghost or duplicate items.
- **Resilience and observability:** Loading/error UX paired with **operator-visible** diagnostics and health signals.
- **Security and abuse at v1 scope:** Input limits and safe errors without leaking internals; implied risk if a **public** deployment has no auth (noted in the PRD; hardening optional post-MVP).
- **Accessibility and responsive behavior:** Touch targets, layout from narrow to wide, keyboard flows — affects component and routing choices.
- **Future auth and multi-tenancy:** Identity boundaries, per-user data, and rate limiting are **post-v1** but **NFR-SC1** requires keeping the **core todo model** evolution-friendly.

## Starter Template Evaluation

### Primary Technology Domain

**Full-stack web:** browser **SPA** (React + TypeScript) talking to a **Node HTTP API** (Fastify), aligned with the PRD’s client–server split and JSON API expectations.

### Starter Options Considered

- **Vite + React + TypeScript (`react-ts`):** Official, actively maintained SPA toolchain; fast dev server, modern ES build; [Vitest](https://vitest.dev/) is the natural test add-on when you need it. Matches PRD preference for a SPA without baking in SSR.
- **Next.js / full-stack React frameworks:** Capable, but add routing and rendering models that are optional given low SEO emphasis and explicit SPA + API wording.
- **T3 Stack and similar:** Strong when you want an opinionated monolith (e.g. DB + API patterns in one place); more moving parts than required for v1 CRUD unless the team standardizes on it.

### Selected approach: Vite (client) + create-fastify (API)

**Rationale:** Keeps **frontend and backend boundaries** obvious (helps CORS, env-based API URL, and future auth), stays **boring and well documented**, and matches **intermediate** full-stack work without premature product-framework lock-in. Starters intentionally **do not** choose the database; that remains an explicit architecture decision in later steps.

**Initialization commands** (run from repository root; verify Node **≥ 20** first):

```bash
npm create vite@latest client -- --template react-ts
cd client && npm install && cd ..
npm init fastify api
cd api && npm install
```

Then wire **dev proxies or env** so the SPA calls the API origin you document (implementation detail in the first implementation story).

### Architectural Decisions Provided by Starters

**Language & runtime:** TypeScript on the client (Vite `react-ts`); Fastify scaffold is JavaScript-first — TypeScript can be adopted incrementally or by choosing TS templates if the generator offers them in your run.

**Styling solution:** Vite React template ships with minimal CSS; add **Tailwind** or another system in implementation if you want utility-first styling (not prescribed by the starter).

**Build tooling:** **Vite** for the client; **Node + Fastify** for the server with conventional `npm start` / dev patterns from the generated app.

**Testing framework:** Not fully opinionated — **Vitest** pairs naturally with Vite on the client; Fastify docs recommend patterns with your chosen test runner (e.g. Node test runner, Vitest, or others) for API tests.

**Code organization:** Vite: `src/` with component entry at `main.tsx`. create-fastify: typical **plugins / routes** layout with **@fastify/autoload** in the default scaffold — fits growing CRUD routes and a health plugin cleanly.

**Development experience:** Hot reload on the client; Fastify logger and CLI-oriented dev start from generated `package.json` scripts.

**Note:** Running these scaffolds should be treated as the **first implementation story** after stack sign-off.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**

- **Persistence:** SQLite (file per deployment) via **`better-sqlite3`**, with **Drizzle ORM** and **versioned SQL migrations** (`drizzle-kit`).
- **API:** **REST + JSON** todo CRUD with a **single documented error envelope** and stable HTTP status usage.
- **Client sync:** **TanStack Query v5** for server state, mutations, retries, and reconciliation with server truth (supports optimistic UI if used).
- **Security v1:** **No authentication**; **validation**, **CORS configuration**, **TLS in production**, **safe client-facing errors** with richer **operator logs**.

**Important Decisions (Shape Architecture):**

- **OpenAPI** derived from Fastify for a single contract (e.g. `@fastify/swagger` / UI in dev).
- **Environment-based** API base URL (client) and DB path / connection (API).
- **Single-route SPA** for v1; add routing only if the product grows beyond one screen.

**Deferred Decisions (Post-MVP):**

- **Authentication**, per-user data, **rate limiting** / abuse controls for public deployments.
- **Full WCAG** audit, **APM**, and advanced scaling patterns beyond the PRD’s low-contention assumption.

### Data Architecture

- **Database:** **SQLite**, one logical database file per deployment for v1 (single-tenant dataset).
- **Driver:** **`better-sqlite3`** — install `better-sqlite3@latest`; confirm published version on npm when locking dependencies.
- **ORM & migrations:** **Drizzle ORM** + **drizzle-kit** — schema as TypeScript; **`drizzle-kit generate`** for migration files in environments that need reproducible schema; document if **`push`** is allowed for local-only workflows.
- **Modeling:** Todo records include **stable id**, **text**, **completed** flag, **`createdAt`**, and **`updatedAt`**. **`updatedAt`** is **required** and must be set on create and refreshed on every mutating change (toggle, text update if ever added, delete N/A). Schema and API shaped so a future **`user_id`** (or tenant key) can be added **without** redesigning the core todo resource.
- **Validation strategy:** **Fastify JSON Schema** (and/or shared Zod) at HTTP boundary so FR22 is satisfied with stable, machine-readable errors.
- **Caching:** None required for v1 beyond SQLite and process-local access (matches low-contention NFR).
- **Operational note:** Document **DB file path**, persistence volume for containers, and a minimal **backup** story for demo/prod-like environments.

### Authentication & Security

- **Authentication:** **None in v1** (PRD). No sessions, JWT, or API keys for end users.
- **Authorization:** Not applicable beyond deployment-level exposure; treat open API as a **conscious v1 risk** if the deployment is public.
- **Hardening:** **Bounded payload and field length**; reject pathological input (NFR-S1). **CORS** not wide open in production; **HTTPS** where not strictly local (NFR-S2).
- **Errors & logging:** **Generic** user-visible messages; **structured server logs** (e.g. Pino) for troubleshooting (NFR-S3, FR25).
- **Future seam:** Fastify **plugin** boundary and **schema evolution** path for auth and multi-tenancy without rewriting core todo semantics (NFR-SC1).

### API & Communication Patterns

- **Pattern:** **REST**, JSON bodies, resource-centric **`/todos`** (or namespace **`/api/todos`** — pick one and keep it consistent).
- **Endpoints (conceptual):** `GET` list, `POST` create, `PATCH` (or `PUT`) toggle/update completion, `DELETE` by id; **404** for missing id, **400** for validation errors.
- **Error format:** Shared envelope, e.g. `{ "error": { "code": "string", "message": "string", "details": … } }` — align with client handling and retries.
- **Documentation:** **OpenAPI** generated from route definitions for agents and developers.
- **Inter-service:** N/A for v1 (single API). **Rate limiting** explicitly **out of v1** unless product/security requirements change.

### Frontend Architecture

- **Server state:** **TanStack Query v5** (`@tanstack/react-query@latest`) — queries for list load, mutations for create/toggle/delete, **cache invalidation** or **optimistic updates** with server reconciliation per PRD.
- **UI state:** Local React state for form fields and transient UI only; **server remains source of truth** after successful fetch (FR26).
- **Components:** Split **list**, **item**, **add form**, and **global loading/error** affordances; keep boundaries clear for testing.
- **Routing:** **No router required** for v1 single view; introduce **React Router** only if navigation scope increases.
- **Performance / UX:** Satisfy **NFR-P1–P3** with immediate loading indicators and non-blocking mutations; **guard double submit** (FR13) via disabled buttons or request de-duplication.
- **Accessibility:** Keyboard-complete core flows, visible focus, semantic structure (FR16, NFR-A1–A2).

### Infrastructure & Deployment

- **Repo layout:** **`client/`** (Vite) + **`api/`** (Fastify); optional **npm workspaces** at root for unified scripts.
- **Configuration:** Client: **`VITE_`-prefixed** public env for API base URL. API: **`PORT`**, **database path/URL**, **`CORS_ORIGIN`**, log level, **`NODE_ENV`**.
- **Development:** Run Vite and Fastify concurrently; document **proxy vs explicit origin** in README.
- **CI:** At minimum **lint**, **typecheck**, **unit tests**, **API integration tests**, **production build** of the client, and **Playwright E2E** in CI (against docker-compose stack or equivalent).
- **Deployment:** **Docker Compose** is the reference orchestration for local and demo: **multi-stage** images, **non-root** runtime users, **explicit health checks** on services, **named network**, **volumes** for SQLite persistence, and **environment** passed via compose / `.env`. No separate database container for v1 (**SQLite** file on a **volume** mounted into the API container); a **postgres** service remains optional for future stacks.
- **Health & operability (containers):** API exposes **liveness** and **readiness** HTTP endpoints (e.g. **`GET /health`** process up; **`GET /ready`** includes DB reachable / migrations applied as appropriate). **Dockerfile `HEALTHCHECK`** and **`healthcheck:`** in **`docker-compose.yml`** must call those endpoints (or equivalent) so Compose reports healthy dependents. **Pino** logs to **stdout/stderr** only so **`docker compose logs`** surfaces application logs without extra agents.
- **Testing:** **Playwright** for **E2E** in a dedicated **`e2e/`** package (or repo root), with a **minimum** suite covering: **create todo**, **complete todo**, **delete todo**, **empty state**, and **error handling** (e.g. simulated API failure or unhealthy dependency). **API integration tests** exercise real HTTP (e.g. **`fastify.inject`** against an app instance with **test SQLite** or ephemeral DB) for CRUD, validation errors, and **404** semantics—not only mocks.
- **Observability:** Structured logs on API to **stdout**; no mandatory APM for v1.

### Decision Impact Analysis

**Implementation sequence:**

1. Scaffold **client** and **api** (per Starter Template Evaluation).
2. Add **Drizzle** schema, **migrations**, and SQLite connection in the API.
3. Implement **todo routes**, validation, error mapping, **`/health`** and **`/ready`** endpoints.
4. Integrate client **QueryClient**, API calls, and **empty / loading / error** UX.
5. Add **API integration tests** and **Playwright E2E** (scenarios listed under Project Structure).
6. Add **`docker/`** Dockerfiles (multi-stage, non-root) and root **`docker-compose.yml`** (network, volumes, env, health checks).
7. Expose **OpenAPI**, finalize **env** and **README** for run/deploy (including **`docker compose up`** and **`docker compose logs`**).

**Cross-component dependencies:**

- **Drizzle schema** and **API DTOs** should stay aligned; consider generated types or a thin shared package later if duplication hurts.
- **Error codes** and **HTTP statuses** must match client retry and messaging behavior.
- **CORS origin** and **Vite env** must match the API’s public URL per environment.

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical conflict points addressed:** naming (DB, REST, code), project layout, JSON and error shapes, dates, TanStack Query usage, loading/error behavior, logging.

### Naming Patterns

**Database naming (Drizzle / SQLite):**

- Table: **`todos`** (plural, lowercase).
- Columns: **`snake_case`** in the physical schema (e.g. `id`, `text`, `completed`, `created_at`, `updated_at`). Map to TypeScript field names in Drizzle with explicit `columnName` if using camelCase in application types.
- Foreign keys (future): `user_id` etc. — **`snake_case`**.
- Indexes: `idx_todos_created_at` or Drizzle-generated names; **do not** mix ad-hoc naming per feature.

**API naming:**

- Base path: **`/todos`** **or** **`/api/todos`** — choose **one** in the first API story and **never** mix.
- Route params: **`:id`** in Fastify path (`/todos/:id`); OpenAPI must use the same.
- Query params: **`snake_case`** if ever needed (e.g. `filter_active`) for consistency with HTTP conventions; prefer minimal surface for v1.

**Code naming:**

- React components: **PascalCase** files and exports (`TodoList.tsx`, `TodoItem.tsx`).
- Hooks: **`use` prefix** + camelCase (`useTodosQuery`).
- Utilities: **camelCase** files (`todoApi.ts`, `formatError.ts`).
- Server plugins/routes: **kebab-case or camelCase** files consistent with generated Fastify layout — **match whatever the scaffold uses** and do not introduce a second convention.

### Structure Patterns

**Project organization:**

- **`client/`** — Vite app; feature-adjacent grouping under `src/` is fine (e.g. `src/todos/`, `src/components/`, `src/api/`).
- **`api/`** — Fastify app; keep **`routes/`**, **`plugins/`** aligned with create-fastify autoload conventions.
- **Shared types:** optional later `packages/shared`; until then, **duplicate minimally** or generate from OpenAPI — do not invent a third shape.

**Tests:**

- **Co-locate** tests as `*.test.ts` / `*.test.tsx` next to source, **or** mirror under `src/**/__tests__/` — pick **one** per package and stick to it (recommended: co-located `*.test.ts` for API unit tests, same for client with Vitest).
- **API integration tests:** live under **`api/test/integration/`** (or `api/src/__integration__/` if using a `src` layout) — build the real Fastify app, use a **dedicated test database file** or in-memory SQLite per run, run migrations or schema push as documented, then assert **HTTP status**, **JSON body**, and **persistence** across requests.
- **E2E (Playwright):** live under **`e2e/`** at repo root (or `client/e2e/` if preferred—pick one). **Minimum** specs: **create todo**, **mark complete**, **delete todo**, **empty state** (no todos), **error handling** (e.g. API down, 5xx, or network failure path with user-visible recovery). E2E runs against **composed URLs** (e.g. `BASE_URL` for web, optional direct API URL for setup/teardown).

**Config & env:**

- Client: only **`VITE_*`** for values that may appear in the browser.
- API: **no secrets** in client env; DB path, CORS, log level **server-only**.

### Format Patterns

**JSON field naming:**

- **camelCase** in all **HTTP request/response bodies** (`createdAt`, `updatedAt`, `completed`).

**Dates and times:**

- Serialize as **ISO 8601** strings in **UTC** (e.g. `2026-04-08T12:00:00.000Z`) in API JSON. UI may format for display locally.

**Success responses:**

- **GET `/todos`:** `{ "todos": [ { "id", "text", "completed", "createdAt", "updatedAt" } ] }` or a bare array **only if** documented in OpenAPI — **prefer a keyed object** for forward compatibility.
- **POST/PATCH:** return the **full todo** entity including **`updatedAt`** after mutation.
- **DELETE:** **204 No Content** **or** **200** with body — choose **one** and document in OpenAPI; **do not** mix.

**Errors:**

- Body shape: **`{ "error": { "code": string, "message": string, "details"?: unknown } }`** for all non-2xx **JSON** errors.
- **400** validation, **404** missing todo, **500** unexpected (generic message to client).

### Communication Patterns

**Events / realtime:**

- **None** in v1 (no WebSockets, no custom DOM event bus for data sync). Use **TanStack Query** cache updates only.

**State management:**

- **Server data:** only through **TanStack Query** (`useQuery`, `useMutation`); no parallel “global Redux copy” of the todo list.
- **Mutations:** use **`mutationKey`** / **`queryKey`** consistently (e.g. `['todos']`); invalidate or update cache on success; reconcile **optimistic** rows with server **`id` and `updatedAt`** if optimistic UI is used.

### Process Patterns

**Loading:**

- **Query:** use **`isPending` / `isFetching`** from TanStack Query; show loading on **first load** of the list (NFR-P2).
- **Mutations:** **per-mutation** pending state or disabled controls; avoid a single global flag that blocks unrelated UI unless unavoidable.

**Errors:**

- Map API **`error.code`** (or status) to **user-visible** strings in one **small module** on the client; **do not** stringify raw server traces to users.
- **Retry:** optional for **GET** only; **mutations** retry only where **idempotent** or with clear UX (user confirms) — default **no blind retry** on POST.

**Validation:**

- **Server is authoritative:** validate on API with **JSON Schema**; client may mirror for UX but **must not** trust client-only validation.

**Logging:**

- Use **Fastify/Pino** structured logs; include **`reqId`**, route, **todo id** when relevant; **never** log full abusive payloads at info level. In containers, **do not** log only to files by default — **stdout/stderr** so **`docker compose logs <service>`** captures output.

**Containers & Compose:**

- **Dockerfiles** under **`docker/`** (e.g. **`api.Dockerfile`**, **`web.Dockerfile`**) use **multi-stage** builds (install/build → minimal runtime). Runtime stage runs as a **non-root** `USER` with only required artifacts.
- **`docker-compose.yml`** at repo root: **`api`** service (Node + SQLite **volume** mount for `DATABASE_PATH`), **`web`** service (e.g. **nginx** serving **`client` `dist`** or equivalent static server), shared **bridge network** (e.g. `app_net`), **environment** from **`.env`** / compose `environment:` (never commit secrets). Services use **`depends_on`** with **`condition: service_healthy`** where order matters.
- **Health:** each long-running container has **`HEALTHCHECK`** aligned with app endpoints; **`/health`** (liveness) and **`/ready`** (readiness) on the API are the contract Compose and orchestrators use.

### Enforcement Guidelines

**All AI agents MUST:**

- Follow the **single** REST prefix and **one** DELETE response convention documented in OpenAPI.
- Use **camelCase JSON** and **ISO 8601** timestamps for API bodies.
- Persist **`updatedAt`** on **every** mutating operation on a todo, alongside **`createdAt`** on create.
- Use **TanStack Query** for all todo server state in the client.
- Use the **standard error envelope** for API failures.
- Ship **API integration tests** for the todo API and **Playwright E2E** covering **create**, **complete**, **delete**, **empty state**, and **error handling** at minimum.
- Implement **`/health`** and **`/ready`** on the API and wire **Docker / Compose health checks** to them; log to **stdout/stderr** for **`docker compose logs`**.

**Pattern enforcement:**

- **PR / CI:** run **lint + typecheck + unit tests + API integration tests + client build + Playwright** (against compose or CI service matrix); reject PRs that introduce a second API path prefix or error shape.
- **OpenAPI** diff is the **contract review** for API changes.

### Pattern Examples

**Good:**

- PATCH returns the updated todo with a new **`updatedAt`**; client replaces cache entry by **`id`**.
- DB row has `updated_at` reflecting the last toggle time.

**Anti-patterns:**

- Mixing `/todo` and `/todos`, or **snake_case** in JSON without team-wide exception.
- Skipping **`updatedAt`** on PATCH or toggle.
- Storing the canonical todo list only in React **useState** without Query sync after mutations.
- Running the API container as **root**, or logging **only** to files inside the container with no **stdout** stream for operators.
- **Compose** services without **health checks** when the API must be up before E2E or the **web** proxy starts.

## Project Structure & Boundaries

### Complete Project Directory Structure

```text
bmad-todo-app/
├── README.md
├── package.json                      # optional: workspaces + root scripts (dev, test, compose)
├── .gitignore
├── .env.example                      # compose + local dev variables (document only)
├── docker-compose.yml                # api + web; network, volumes, env, healthcheck, depends_on
├── .github/
│   └── workflows/
│       └── ci.yml                    # lint, typecheck, unit, api integration, build, playwright
├── docker/
│   ├── api.Dockerfile                # multi-stage; non-root; HEALTHCHECK → /health
│   └── web.Dockerfile                # multi-stage: build client → nginx (or similar); non-root; static health
├── client/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   ├── index.html
│   ├── .env.example                  # VITE_API_BASE_URL
│   ├── public/
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── vite-env.d.ts
│       ├── api/
│       │   ├── client.ts
│       │   └── todos.ts
│       ├── todos/
│       │   ├── TodoApp.tsx
│       │   ├── TodoList.tsx
│       │   ├── TodoItem.tsx
│       │   ├── AddTodoForm.tsx
│       │   └── useTodosQuery.ts
│       ├── components/
│       └── lib/
│           ├── queryClient.ts
│           └── mapApiError.ts
├── api/
│   ├── package.json
│   ├── drizzle.config.ts
│   ├── .env.example                  # PORT, DATABASE_PATH, CORS_ORIGIN, LOG_LEVEL, NODE_ENV
│   ├── app.js                        # or app.ts — align with create-fastify
│   ├── plugins/
│   ├── routes/
│   │   ├── root.js                   # extend: GET /health, GET /ready
│   │   └── todos.js
│   ├── db/
│   │   ├── index.js
│   │   └── schema.js
│   ├── migrations/                   # drizzle-kit SQL output
│   ├── test/
│   │   ├── helper.js                 # build app for tests
│   │   └── integration/
│   │       ├── todos.crud.test.js    # HTTP integration: CRUD, 400, 404, persistence
│   │       └── todos.errors.test.js  # optional split by concern
│   └── routes/todos.test.js          # unit/route tests if co-located
└── e2e/
    ├── package.json                  # optional if using root workspace
    ├── playwright.config.ts
    └── tests/
        ├── todo-happy-path.spec.ts   # create, complete, delete
        ├── todo-empty-state.spec.ts
        └── todo-error-handling.spec.ts
```

**Docker Compose (behavioral contract, not full YAML):**

- **`api`:** build `docker/api.Dockerfile`; **env** `PORT`, `DATABASE_PATH` (path inside container, e.g. `/data/todos.db`); **volume** `./data/api:/data` or named volume `sqlite_data:/data`; **ports** publish API; **healthcheck** `GET http://127.0.0.1:$PORT/health` (and/or `/ready` for readiness gates); **logging** stdout.
- **`web`:** build `docker/web.Dockerfile` (build-arg for `VITE_API_BASE_URL` pointing at public API URL as seen from browser—often host-mapped port or reverse-proxy path); **ports** publish static site; **healthcheck** HTTP 200 on `/` or `/health` on nginx; **depends_on** `api` with **`service_healthy`** if SPA needs API for first paint (optional—document actual need).
- **`networks`:** e.g. `app_net` bridge; both services attached; E2E job can run Playwright with **`baseURL`** = `web` URL and use **same network** in CI or hit `localhost` mapped ports.
- **No `database` service** for v1 (SQLite). Document optional future **`postgres`** service and remove SQLite volume when migrating.

### Architectural Boundaries

**API boundaries:**

- **Public HTTP:** Fastify exposes JSON; **liveness** **`/health`** and **readiness** **`/ready`** are part of the public contract for orchestration (not hidden admin-only ports).
- **Persistence:** only **`api/db`** + **`routes/`** touch SQLite; integration tests use **isolated DB files** under **`test/`** or `tmp`.

**Component boundaries:**

- Unchanged: client **`src/todos`** + **`src/api`**; server **routes / plugins / db**.

**Data boundaries:**

- **Production-like compose:** SQLite file on **named or bind-mounted volume** so **`docker compose down`** without volume removal retains data per README.

### Requirements to Structure Mapping

| PRD / quality bar | Location |
|-------------------|----------|
| FR1–FR8, FR14–FR16 | `client/src/todos/*`, `api/routes/todos.*`, `api/db/*` |
| FR9–FR13, error UX | client + `mapApiError.ts`; API error envelope |
| FR17–FR23 | `api/routes/todos.*`, `api/db/*` |
| FR24–FR25, container health | `api/routes/root.*` (`/health`, `/ready`), Pino → stdout, Compose `healthcheck` |
| E2E confidence | `e2e/tests/*.spec.ts` (create, complete, delete, empty, errors) |
| API contract confidence | `api/test/integration/*` |

### Integration Points

**Internal:** Browser → **web** → (static) + browser → **api** JSON; **Playwright** drives browser against **`web`** and asserts UI; may use **`request` fixture** to hit **api** for seeding if needed.

**External:** none v1.

**Data flow:** API **readiness** checks DB open/migrations before reporting **ready**; **web** health is independent (static).

### File Organization Patterns

**Docker:** all production Docker logic under **`docker/`**; **one** `docker-compose.yml` at root; **`.env.example`** lists compose variables (`API_PORT`, `WEB_PORT`, `VITE_API_BASE_URL`, `DATABASE_PATH`, `CORS_ORIGIN`).

**E2E:** **`e2e/`** owns Playwright config and specs; CI installs browsers and runs against **`docker compose up`** (wait-for-healthy) or equivalent.

**API integration tests:** **`api/test/integration/`** — no production imports of test DB path; use env or test harness.

### Development Workflow Integration

**Local:** `pnpm/npm` scripts for parallel client + api; optional `docker compose up --build` for parity with prod-like stack.

**CI:** matrix or job stages: install → unit → **integration** → build images → **compose up** → **Playwright** → artifacts (reports, traces on failure).

**Operations:** **`docker compose logs -f api`** and **`web`** for tailing; document **health** troubleshooting (unready API if DB volume permission or migration failure).

### Testing & Container Checklist (minimum)

- [ ] Playwright: **create** todo  
- [ ] Playwright: **complete** todo  
- [ ] Playwright: **delete** todo  
- [ ] Playwright: **empty** list state  
- [ ] Playwright: **error** path (failed load or mutation; user-visible handling)  
- [ ] API integration: list/create/update/delete + validation + 404  
- [ ] **Multi-stage** Dockerfiles, **non-root** run user  
- [ ] **`docker-compose.yml`**: network, volumes, env, **`healthcheck`**, **`depends_on`/`service_healthy`** where needed  
- [ ] **`/health`** + **`/ready`** implemented; logs on **stdout/stderr**

## Architecture Validation Results

### Coherence Validation

**Decision compatibility:** The stack is internally consistent: **Vite + React + TypeScript** (client), **Fastify + Drizzle + better-sqlite3** (API), **TanStack Query** for server state, **REST + JSON** with a single error envelope, **Pino → stdout** for containers, and **Docker Compose** with **multi-stage / non-root** images. Node **20+** satisfies Vite, Fastify v5, and native addon expectations for `better-sqlite3`. No contradictory technology choices were identified.

**Pattern consistency:** Naming rules (**snake_case** DB, **camelCase** JSON), process rules (Query for server state, server-authoritative validation), and container rules (health endpoints + Compose `healthcheck`) align with the core decisions. The optional ambiguity **(`/todos` vs `/api/todos`)** is explicitly “choose once”—implementation must record the choice in OpenAPI and never mix prefixes.

**Structure alignment:** The directory tree supports **client / api / e2e / docker** boundaries, integration tests beside the API, Playwright at repo level, and SQLite persistence via **volumes** on the API service. **No separate DB container** for v1 matches SQLite and keeps networking simple.

### Requirements Coverage Validation

**Epic / feature coverage:** No epics were in `inputDocuments`; coverage is traced via **PRD FRs** and the **requirements → structure** table in **Project Structure & Boundaries**.

**Functional requirements coverage:** **FR1–FR26** are supported: SPA entry and todo CRUD (client + routes + DB), empty/loading/error and double-submit mitigation (UI + patterns), persistence and API semantics (Drizzle + Fastify), operability (**/health**, **/ready**, logs, integration/E2E tests), and **FR26** (Query + invalidation/reconciliation). **FR7** (metadata including creation time) is met with **`createdAt`** and extended with required **`updatedAt`** per architecture.

**Non-functional requirements coverage:** **Performance (NFR-P1–P3):** addressed via UX patterns, Query pending states, and API discipline. **Reliability (NFR-R1–R2):** SQLite + migrations + durable file on volume. **Security (NFR-S1–S3):** validation bounds, TLS in prod, CORS config, safe errors + structured logs. **Accessibility (NFR-A1–A2):** documented in frontend patterns. **Scalability (NFR-SC1):** schema/API seam for future `user_id` / tenant without rewriting core todo model.

### Implementation Readiness Validation

**Decision completeness:** Critical choices (persistence, API style, client sync, security posture, Docker/E2E/integration testing) are documented. Runtime versions use **`@latest` / lockfile at install** where appropriate—agents should pin after first install.

**Structure completeness:** Target layout is concrete (including **`e2e/`**, **`api/test/integration/`**, **`docker/`**, **`docker-compose.yml`**). Scaffold filenames may differ slightly from **create-fastify** output; first story normalizes to this layout.

**Pattern completeness:** Major conflict points (naming, errors, dates, DELETE convention, logging, health, tests) are specified with good/anti-pattern examples. Remaining **single choice**: REST prefix and **DELETE** **204 vs 200**—must be fixed in OpenAPI in the first API story.

### Gap Analysis Results

**Critical gaps:** None identified for starting implementation.

**Important gaps:**

- **Lock REST prefix** (`/api/todos` vs `/todos`) and **DELETE response** convention in the first implementation task and reflect in OpenAPI.

**Nice-to-have gaps:**

- Shared **`packages/types`** or OpenAPI-generated client types to reduce duplication between client and API.
- Optional **postgres** compose service documented when moving off SQLite.

### Validation Issues Addressed

No open blocking issues at validation time. The **important gap** above is tracked as an **implementation gate**, not a rework of architecture.

### Architecture Completeness Checklist

**Requirements analysis**

- [x] Project context analyzed against PRD
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped

**Architectural decisions**

- [x] Critical decisions documented (with install-time version pinning)
- [x] Technology stack specified end-to-end
- [x] Integration patterns defined (HTTP, Docker, CI)
- [x] Performance, security, and ops considerations addressed

**Implementation patterns**

- [x] Naming conventions established
- [x] Structure and test placement defined
- [x] Communication patterns specified (Query, no realtime v1)
- [x] Process patterns documented (errors, loading, validation, containers)

**Project structure**

- [x] Directory structure defined (including tests and Docker)
- [x] Component and service boundaries established
- [x] Integration points mapped
- [x] FR mapping table present

### Architecture Readiness Assessment

**Overall status:** **READY FOR IMPLEMENTATION**

**Confidence level:** **High** for v1 scope; **medium** items are routine first-story clarifications (OpenAPI details, exact compose YAML).

**Key strengths:** Clear client/server split; **boring** proven stack; explicit **testing and container** bar; **health/readiness** and **stdout** logging aligned with operations; **updatedAt** discipline documented.

**Areas for future enhancement:** Authentication, rate limiting, Postgres/multi-instance, stricter WCAG, APM.

### Implementation Handoff

**AI agent guidelines**

- Treat this document as the **source of truth** for stack, patterns, structure, and quality bar.
- Follow **Implementation Patterns** for names, JSON shape, errors, and tests.
- Do not introduce a second API prefix, error envelope, or canonical client-side todo store outside TanStack Query.

**First implementation priority**

1. Run scaffolds: `npm create vite@latest client -- --template react-ts` and `npm init fastify api` (per **Starter Template Evaluation**).
2. **Lock** OpenAPI path prefix and **DELETE** semantics; add **`/health`** and **`/ready`**.
3. Add **Drizzle** schema (with **`created_at` / `updated_at`**) and migrations; implement todo routes and client **Query** integration.
4. Add **integration** and **Playwright** suites and **Dockerfile** / **docker-compose.yml** per **Project Structure & Boundaries**.

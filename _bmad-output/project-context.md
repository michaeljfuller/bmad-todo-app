---
project_name: bmad-todo-app
user_name: Michael
date: '2026-04-09'
sections_completed:
  - technology_stack
  - language_rules
  - framework_rules
  - testing_rules
  - quality_rules
  - workflow_rules
  - anti_patterns
  - ways_of_working
status: complete
rule_count: 48
optimized_for_llm: true
discovery_sources:
  - _bmad-output/planning-artifacts/architecture.md
codebase_status: planning_only
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

**Target stack** (align with `_bmad-output/planning-artifacts/architecture.md`; **pin exact versions in each `package.json`** when scaffolding—this repo had no app packages at context generation time):

| Layer | Technology | Notes |
|--------|------------|--------|
| Runtime | **Node ≥ 20** | Required before `npm create` / generators. |
| Client | **Vite** + **React** + **TypeScript** (`react-ts`) | SPA; no Next.js for v1 unless product changes. |
| Server state | **TanStack Query v5** (`@tanstack/react-query`) | All todo list/mutation state from the API—no parallel canonical copy. |
| API | **Fastify** (`npm init fastify` / **@fastify/autoload**) | REST + JSON; OpenAPI from routes (**@fastify/swagger** in dev). |
| Persistence | **SQLite** + **`better-sqlite3`** | One DB file per deployment; path via env. |
| ORM | **Drizzle** + **drizzle-kit** | Schema in TS; versioned SQL migrations (`generate` / documented `push` for local only). |
| Validation | **Fastify JSON Schema** (and/or **Zod** at boundary) | Server authoritative; stable 400 responses. |
| Client tests | **Vitest** | Natural fit with Vite. |
| E2E | **Playwright** | Root **`e2e/`** (or one other root—**pick one**, document in README). |
| Containers | **Docker Compose** + multi-stage **`docker/*.Dockerfile`** | Non-root runtime users; **HEALTHCHECK** → app endpoints. |

**Env:** Client exposes only **`VITE_*`** to the browser. API: **`PORT`**, **`DATABASE_PATH`**, **`CORS_ORIGIN`**, log level, **`NODE_ENV`**—never ship secrets to the client bundle.

---

## Critical Implementation Rules

### Language-Specific Rules

- **HTTP JSON:** **`camelCase`** fields (`createdAt`, `updatedAt`, `completed`, `text`, `id`). **Never** use `snake_case` in JSON bodies without an explicit team exception.
- **DB columns:** **`snake_case`** in SQLite (`created_at`, `updated_at`, …). In Drizzle, use **`columnName`** when TS fields are camelCase.
- **Dates in API:** **ISO 8601 strings in UTC** (e.g. `2026-04-09T12:00:00.000Z`).
- **API errors:** Every non-2xx JSON error uses **`{ "error": { "code", "message", "details?" } }`**—same shape everywhere.
- **TypeScript:** Prefer strict settings once `tsconfig` exists; do not loosen without cause. Match import style (`type` imports) to what ESLint/Prettier enforce after scaffold.

### Framework-Specific Rules

- **React:** Components **`PascalCase`** files/exports (`TodoList.tsx`). Hooks **`use`** prefix + camelCase (`useTodosQuery`).
- **Server data:** **Only TanStack Query** (`useQuery`, `useMutation`) for todos—**no** Redux/global store mirroring the list for v1.
- **Query keys:** Stable keys (e.g. **`['todos']`**); align `mutationKey` / invalidation with the same scheme.
- **Mutations:** Support **loading/pending per action**; **guard double submit** (disabled button and/or de-duplication) per PRD.
- **Optimistic updates:** If used, reconcile on success using server **`id`** and **`updatedAt`**.
- **Fastify:** New routes/plugins **match the generator’s file naming** (kebab vs camel)—**do not** introduce a second convention.
- **REST base path:** **`/todos`** **or** **`/api/todos`**—choose **once** in the first API story and **never** mix.

### Testing Rules

- **Placement:** **Co-locate** **`*.test.ts` / `*.test.tsx`** next to source **or** mirror under **`__tests__/`**—**one convention per package**, stick to it.
- **Unit coverage:** Aim for **at least 70%** code coverage on unit tests (enforce via Vitest coverage reports / CI thresholds once configured).
- **API integration:** Real HTTP (**`fastify.inject`** or supertest) under **`api/test/integration/`** with an **isolated SQLite file** (or ephemeral DB) per run; assert **status, JSON body, persistence** across requests.
- **E2E minimum:** Playwright covers **create**, **complete**, **delete**, **empty state**, and **error/recovery** (API down / 5xx / network failure with user-visible recovery).
- **Contract:** **OpenAPI** is the review surface for API changes; don’t merge behavior that contradicts the published spec.

### Code Quality & Style Rules

- **Utilities / API client modules:** **camelCase** files (`todoApi.ts`, `mapApiError.ts`).
- **Success shapes:** Prefer **`GET /todos` → `{ "todos": [...] }`** (keyed object) for forward compatibility unless OpenAPI documents a bare array.
- **DELETE:** **Either** `204 No Content` **or** `200` with body—**one** approach, documented in OpenAPI; **never** mix.
- **User-facing errors:** Map **`error.code`** / status in **one small client module**; **never** show raw stack traces or internal messages to users.
- **Logging:** **Pino** structured logs; include **`reqId`**, route, **todo id** when relevant; **stdout/stderr** in containers (not logfiles-only).

### Development Workflow Rules

- **CI bar** (when pipelines exist): **lint**, **typecheck**, **unit tests**, **API integration tests**, **production client build**, **Playwright** (against compose or equivalent).
- **Compose:** **`depends_on`** with **`condition: service_healthy`** where order matters; API **`/health`** (liveness) and **`/ready`** (readiness, DB/migrations as appropriate).
- **Layout:** **`client/`**, **`api/`**, **`e2e/`**, **`docker/`**, root **`docker-compose.yml`**—don’t scatter CRUD across undocumented folders.

### Ways of working (tools & review)

- **API:** While implementing or changing the API, use **Postman MCP** to exercise endpoints and **validate behavior against the contract** (status codes, JSON shape, errors)—keep results aligned with **OpenAPI**.
- **Frontend:** During development, use **Chrome DevTools** to **debug and inspect** (network, console, React/components as applicable). Use **Playwright MCP** to **automate browser interactions** when that speeds up verification or mirrors E2E-style flows.
- **Code review:** In addition to correctness, explicitly check for **common security issues** relevant to this stack—for example **XSS** (unsafe rendering, `dangerouslySetInnerHTML`, unsanitized HTML in the DOM), **injection** (e.g. **SQL** via string concatenation or non-parameterized queries; validate use of Drizzle/ORM and bound inputs), and other **OWASP-style** basics (unsafe redirects, sensitive data in logs or client bundles).

### Critical Don't-Miss Rules

- **Always set `updatedAt`** on **every** mutating todo operation (create sets `createdAt` + `updatedAt`; toggle/update refreshes `updatedAt`). **PATCH/POST responses** return the **full todo** including new **`updatedAt`**.
- **Statuses:** **400** validation, **404** missing id, **500** unexpected (generic client message; details in logs).
- **GET retries:** Optional; **POST** mutations—**no blind retry** unless idempotent or UX explicitly confirms.
- **Table name:** **`todos`** (plural, lowercase). **Route param:** **`:id`** consistent with OpenAPI.
- **Anti-patterns:** Mixing path prefixes; **snake_case JSON**; **skipping `updatedAt`**; **canonical list only in `useState`** without Query sync after mutations; API container as **root**; **no health checks** when services depend on API readiness; **CORS** wide open in production.

---

## Usage Guidelines

**For AI Agents:**

- Read this file before implementing any code in this repository.
- Follow **all** rules above; when architecture and this file overlap, treat them as one contract.
- Use the **Ways of working** tools when available (**Postman MCP**, **Chrome DevTools**, **Playwright MCP**) and hold unit coverage and **review security** checks to the stated bar.
- If something is ambiguous, prefer the **stricter** interpretation (correctness, single contract, server as source of truth).
- After scaffolding, **update the Technology Stack table** with pinned versions from `package.json` / lockfiles.

**For Humans:**

- Keep this file **lean**—agent reminders only, not a full PRD.
- Refresh when the stack or API contract changes; remove rules that become obvious.
- **Last Updated:** 2026-04-09

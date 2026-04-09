---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
  - step-04-final-validation
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
---

# bmad-todo-app - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for bmad-todo-app, decomposing the requirements from the PRD, UX Design specification, and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: User can open the application and reach the todo experience **without mandatory onboarding** or training content.

FR2: User can **create** a todo with a **short text description**.

FR3: User can **view all todos** in a **single list**.

FR4: User can **mark a todo complete**.

FR5: User can **mark a completed todo active** again.

FR6: User can **delete** a todo.

FR7: User can see **basic metadata** for each todo, including **creation time**.

FR8: User can **visually distinguish** completed todos from active todos.

FR9: User sees a **clear empty state** when there are no todos.

FR10: User sees **loading feedback** while todos are being retrieved.

FR11: User sees an **actionable outcome** when loading fails and can **attempt recovery** (e.g. retry).

FR12: User sees an **actionable outcome** when **create, update, or delete** fails and can **attempt recovery** without losing understanding of list state.

FR13: User is **protected from accidental repeated submissions** that could create **duplicate todos** under slow or uncertain conditions.

FR14: User sees the **same todo collection** after **reload** or **return visit** under the **same deployment** (single logical dataset, no accounts in v1).

FR15: User can perform **core todo actions** on **narrow and wide** layouts.

FR16: User can **add, complete, and delete** todos using **keyboard-only** interaction, with **visible focus** and sensible **reading/interaction order**.

FR17: System **persists** todos for later retrieval.

FR18: System **accepts** new todos from the **client application**.

FR19: System **supplies** the current todo collection to the **client application** on request.

FR20: System **updates** a todo’s **completion state** when requested by the **client application**.

FR21: System **removes** a todo from persisted storage when requested by the **client application**.

FR22: System **rejects invalid** todo input with an outcome the **client application** can interpret.

FR23: System indicates when a **requested todo does not exist**.

FR24: Operator can **verify** the running application and **critical dependencies** are reachable for routine checks (e.g. health or readiness signal).

FR25: Operator can **review diagnostic information** about **server-side failures** when troubleshooting.

FR26: After a **successful refresh of data** from the system, the **presented todo list** matches the **system-stored** todo set for that deployment.

### NonFunctional Requirements

NFR-P1: For **core interactions** (create todo, toggle completion, delete todo), the UI provides **user-visible acknowledgment** (e.g. updated list, pending state, or explicit error) **within 1 second** under **typical** device and network assumptions; if server processing exceeds that, a **loading or pending** indicator is shown rather than an **idle** screen.

NFR-P2: **Initial list retrieval** shows a **loading** state **immediately** on first paint of the todo area (no **multi-second unexplained blank** region where the user cannot tell whether work is happening).

NFR-P3: The client UI **remains responsive** to input during routine operations (no **sustained UI lockup** that blocks navigation or focus during a single mutation under normal conditions).

NFR-R1: Once the system **acknowledges** a successful **create, update, or delete**, that change is **durable** across an **API process restart** under the **documented** persistence configuration (no silent rollback on ordinary restart).

NFR-R2: **Concurrent** use is limited to **low contention** scenarios appropriate to a **single logical dataset** (e.g. one primary user, occasional operator traffic); v1 does **not** target **multi-tenant** or **high-traffic** scale.

NFR-S1: Todo **text and metadata** are validated for **reasonable bounds** (e.g. **maximum length**, **rejection** of pathological payloads) so abuse cannot trivially **deny service** or **corrupt** storage.

NFR-S2: **Production** deployments use **encrypted transport** (e.g. **HTTPS/TLS**) between browser and API where the environment is not strictly local development.

NFR-S3: **Error and diagnostic** outputs **avoid leaking** internal implementation details to the **end user** in a way that would **materially ease** attack planning (generic user message, richer detail in operator logs only).

NFR-A1: **Keyboard-only** operation meets **FR16** with **visible focus** on all interactive controls used for core flows.

NFR-A2: **Semantic structure** (headings, lists, control roles/labels) supports **assistive technologies** for the **todo list** and **primary actions** at a **baseline** level consistent with this PRD; a **full WCAG conformance audit** is **not** a v1 gate unless explicitly added later.

NFR-SC1: Architecture and deployment assumptions remain **compatible** with **future** **per-user** or **multi-tenant** growth **without** a **complete rewrite** of the **core todo model** (exact mechanism deferred; **functional requirements** govern features).

### Additional Requirements

- **Epic 1 / scaffold (Architecture):** Initialize **Vite + React + TypeScript** client (`npm create vite@latest client -- --template react-ts`) and **Fastify** API (`npm init fastify api`); **Node ≥ 20**; treat scaffold as first implementation slice after stack sign-off.
- **Persistence:** **SQLite** (file per deployment) via **better-sqlite3**; **Drizzle ORM** + **drizzle-kit** versioned SQL migrations; todo model: stable **id**, **text**, **completed**, **createdAt**, **updatedAt** ( **updatedAt** required on create and refreshed on every mutating change); schema/API must allow future **user_id** / tenant key without redesigning core todo semantics.
- **API:** **REST + JSON**; single path prefix **`/todos` or `/api/todos`** — choose one in first API story and never mix; **GET** list, **POST** create, **PATCH** (or **PUT**) update completion, **DELETE** by id; **404** missing, **400** validation; **DELETE** response convention (**204** vs **200**) chosen once and documented in OpenAPI.
- **Error envelope (JSON):** `{ "error": { "code", "message", "details?" } }` for non-2xx; stable HTTP status usage.
- **OpenAPI** generated from Fastify (e.g. `@fastify/swagger`); contract is source of truth for API changes.
- **Validation:** Fastify **JSON Schema** at HTTP boundary (shared Zod optional); **camelCase** in JSON bodies; dates **ISO 8601 UTC** strings.
- **DB naming:** table **todos**; columns **snake_case** in SQLite; map in Drizzle as documented.
- **Client server state:** **TanStack Query v5** only for todo server data — no parallel canonical copy in global Redux-like store; consistent **queryKey** / **mutationKey** (e.g. `['todos']`); invalidation or optimistic updates with reconciliation to server **id** / **updatedAt**.
- **CORS** and **VITE_**-prefixed API base URL on client; API env: **PORT**, **DATABASE_PATH**, **CORS_ORIGIN**, log level, **NODE_ENV**.
- **Operability:** **GET /health** (liveness), **GET /ready** (readiness including DB); **Pino** structured logs to **stdout/stderr**; include **reqId**, route, todo id when relevant; do not log abusive payloads at info.
- **Testing (minimum):** **API integration tests** (real HTTP, e.g. `fastify.inject`, isolated/test SQLite) for CRUD, validation errors, 404, persistence across requests — under `api/test/integration/` (or equivalent); **Playwright E2E** under **`e2e/`** for create, complete, delete, empty state, error handling (simulated failure / unhealthy dependency).
- **CI:** Lint, typecheck, unit tests, API integration tests, production client build, Playwright (against compose or equivalent).
- **Docker:** **`docker/api.Dockerfile`** and **`docker/web.Dockerfile`** multi-stage, **non-root** runtime; root **`docker-compose.yml`**: **api** (SQLite volume), **web** (static **dist**), shared network, env from `.env`, **healthcheck** / **`depends_on`** with **`service_healthy`** where needed; document **`docker compose up`** and **`docker compose logs`**.
- **PR/CI enforcement:** Reject second API prefix, second error shape, or skipping **updatedAt** on mutations; OpenAPI diff for contract review.

### UX Design Requirements

UX-DR1: Add **Tailwind CSS** to the Vite client; configure **content** paths for `src/**`; extend **tailwind.config** with a **dark-first token layer**: layered neutrals (page, panel, row), **primary / secondary / muted** text, **teal accent** (reference **#2dd4bf**), **error** (and optional warning) hues validated for contrast on dark surfaces; document semantic names (CSS variables or `@apply`) so raw hex is not scattered.

UX-DR2: Implement **Design Direction 9** shell: **TodoApp** as **flex column** — page title → **scrollable list region** (`flex-1`, `min-h-0`) → **bottom-anchored AddTodoForm** with **top border** separator on composer; confirm sticky vs in-flow for small viewports in implementation.

UX-DR3: Ship composite components aligned to architecture naming: **TodoApp**, **TodoList**, **TodoItem**, **AddTodoForm**; plus **QueryErrorBanner** (or equivalent) for load failures with **Retry**; optional **LoadingSkeleton** or immediate list-area loading copy per NFR-P2.

UX-DR4: Apply **button hierarchy**: primary **teal** for **Add** and **Retry**; **Delete** as ghost/outline with visible **focus-visible** ring; **disabled** state during in-flight mutations (opacity + `cursor-not-allowed`) for FR13 / double-submit guard.

UX-DR5: Implement **feedback patterns**: loading occupies **list region** immediately (not blank panel); **banner** for failed list load with Retry; **inline or banner** for failed add/toggle/delete with plain language; centralize user-facing strings via **`mapApiError`** (or equivalent) — no raw stack traces or JSON in UI (NFR-S3).

UX-DR6: **Accessibility:** **WCAG 2.1 AA** targets for core flows where feasible — contrast on **body**, **muted/completed**, **buttons**, **error text**, **focus rings**; **semantic** list (`ul`/`li` or equivalent); checkbox **labeled** by todo text; **Delete** has accessible name; focus order **title → list → composer**; **Enter** submits Add when field focused; **Space** toggles checkbox; honor **`prefers-reduced-motion`** for spinners/transitions.

UX-DR7: **Responsive:** mobile-first **full-width** with horizontal padding; **~44px** minimum touch targets on row actions and Add; **max-width** column on larger breakpoints; **no horizontal scroll** on primary flows (FR15).

UX-DR8: **Empty state:** short headline + one line guidance; **composer remains visible** (Direction 7 tone); must not read as broken or marketing-heavy.

UX-DR9: **Completed todos:** **strikethrough** + **muted** foreground token that stays **readable** and **distinct from disabled** control styling (FR8, NFR-A).

UX-DR10: Show **createdAt** / **updatedAt** as **small secondary** metadata under todo text (FR7); format for local display while API remains ISO strings.

UX-DR11: **Design reference:** Use **`ux-design-directions.html`** only as a **visual reference** (e.g. **#dir-9**); not bundled as production asset.

UX-DR12: **Typography:** system UI stack for v1; page title scale (**text-xl–2xl**, semibold), body **text-base** with comfortable leading, metadata **text-sm**; constrain line length with **max-w-xl–2xl** on wide screens.

### FR Coverage Map

| ID | Epic | Notes |
|----|------|--------|
| FR1 | Epic 3 | Single-surface todo UI; no mandatory onboarding |
| FR2 | Epic 3 | Create todo with short text |
| FR3 | Epic 3 | Single list view |
| FR4 | Epic 3 | Mark complete |
| FR5 | Epic 3 | Mark active again |
| FR6 | Epic 3 | Delete todo |
| FR7 | Epic 3 | Metadata including creation time (API from Epic 2) |
| FR8 | Epic 3 | Visual distinction active vs completed |
| FR9 | Epic 3 | Empty state |
| FR10 | Epic 3 | Loading while list loads |
| FR11 | Epic 3 | Actionable load failure + recovery |
| FR12 | Epic 3 | Actionable mutation failure + recovery |
| FR13 | Epic 3 | Double-submit / duplicate protection |
| FR14 | Epic 3 | Cross-session continuity (requires Epic 2 persistence + Epic 3 UI) |
| FR15 | Epic 3 | Narrow and wide layouts |
| FR16 | Epic 3 | Keyboard-only core flows, visible focus, sensible order |
| FR17 | Epic 2 | Persist todos |
| FR18 | Epic 2 | Accept new todos from client |
| FR19 | Epic 2 | Supply todo collection |
| FR20 | Epic 2 | Update completion state |
| FR21 | Epic 2 | Remove todo from storage |
| FR22 | Epic 2 | Reject invalid input with interpretable outcome |
| FR23 | Epic 2 | Missing todo indicated |
| FR24 | Epic 4 | **Liveness** (`/health`) and **readiness** (`/ready`, including DB / migrations) plus **Compose** / image **health checks** wired to those endpoints |
| FR25 | Epic 2 | Structured server logs (e.g. **Pino** to stdout) and operator diagnostics for server-side failures |
| FR26 | Epic 3 | UI matches server after successful refresh (Epic 2 provides authoritative API) |

**NFRs (summary):** **NFR-P1–P3**, **NFR-A1–A2**, **NFR-S2** (client/TLS posture) → primarily **Epic 3**. **NFR-R1–R2**, **NFR-S1**, **NFR-S3**, **NFR-SC1** → primarily **Epic 2**. **Contributor onboarding, local dev scripts, non-container CI** → **Epic 1**. **Container images, compose orchestration, deploy-shaped health gates** → **Epic 4**.

## Epic List

### Epic 1: Foundation, repo layout, and local delivery pipeline

**Goal:** A new contributor (Jordan) can **clone the repository**, follow the **README**, run **documented npm/pnpm scripts**, and start **local development** (client + API processes) with **lint**, **typecheck**, **unit tests**, **client production build**, and a **green Playwright scaffold** in **CI**.

**FRs covered:** None directly; enables engineering velocity for later epics.

**In scope:**

- **Layout:** **`client/`**, **`api/`**, **`e2e/`**, optional root **npm workspaces**, matching Architecture for source packages.
- **Scaffolds:** **Vite + React + TypeScript** client and **Fastify** API (per starter evaluation), both startable via documented scripts.
- **`.gitignore` (root):** Sensible defaults for this stack—at minimum **`node_modules/`**, **`dist/`** / build outputs, **`.env`** / **`.env.*`** (keep **`.env.example` tracked), **SQLite / local DB files** (`*.db`, `*.sqlite*`), **logs**, **coverage**, **OS/editor cruft** (e.g. `.DS_Store`), and **Playwright artifacts** (`playwright-report/`, `test-results/`, `blob-report/`, `.cache/playwright` or equivalent).
- **Playwright (scaffold only):** **`e2e/`** package (or root workspace member) with **`playwright.config.ts`**, **`@playwright/test`**, **`test:e2e`** (and **`playwright install`** documented in README); include a **minimal spec** (e.g. smoke against **`about:blank`** or static placeholder) so **`playwright test`** exits successfully in CI **before** product journeys exist. **Feature and journey E2E** are **Epic 3**—this epic only establishes the **harness**, scripts, and ignore rules.
- **CI:** **lint**, **typecheck**, **unit tests** (client + api), **client production build**, and a job that **installs Playwright browsers** (per CI docs) and runs **`test:e2e`** (e.g. GitHub Actions).
- **Tests:** **Unit** harnesses—client (**Vitest** or equivalent) and api (team-agreed runner)—**plus** the **Playwright scaffold** above (not integration tests against the todo API; those are **Epic 2**).
- **Scripts:** **dev** (parallel client + api), **test** / **test:unit**, **test:e2e**, **bootstrap** / **setup** for fresh clones (install, **`.env.example`** copy, optional first-run checks).
- **Docs:** **README** (prerequisites such as **Node ≥ 20**, clone → install → dev → unit test → **Playwright browser install** for E2E); **`.env.example`** for local client and api.

**Out of scope (do not start here—avoids duplicate or premature work):** **`docker/`**, **`docker-compose.yml`**, image builds, **liveness/readiness** routes, **HTTP integration** test suites (todo API), and **npm scripts** whose sole purpose is Compose or image workflows.

**Implementation note:** **OpenAPI path prefix** and **DELETE** response convention are decided when **todo** routes land (not required for empty scaffolds).

---

### Epic 2: Reliable todo API, persistence, and HTTP integration tests

**Goal:** The **HTTP API** durably stores and serves todos with **validation**, **predictable errors**, and **OpenAPI** documentation. **Integration tests are created and expanded alongside the API** (not deferred to a separate testing epic).

**FRs covered:** **FR17, FR18, FR19, FR20, FR21, FR22, FR23**; **FR25** (structured logging and operator diagnostics); enables **FR14** and **FR26** at the server boundary.

**Testing (mandatory in-epic):**

- Maintain **`api/test/integration/`** (or equivalent) with **real HTTP** against a built app instance (e.g. **`fastify.inject`**), **isolated/test SQLite** (or documented ephemeral DB), migrations or schema apply as documented.
- Cover **list/create/update/delete**, **validation → 400**, **missing id → 404**, and **persistence across sequential requests**.
- **CI:** add or extend a job that runs **API integration tests** when this epic’s work lands.

**Implementation notes:** **SQLite + better-sqlite3 + Drizzle + migrations**; **camelCase JSON**, **ISO 8601** dates, **error envelope**, **TanStack Query–friendly** responses. **Liveness/readiness HTTP routes** are **Epic 4** (or stub only if required for local ergonomics—prefer implementing fully with **Epic 4**).

---

### Epic 3: Calm, complete todo experience in the browser (component tests + journey-driven E2E)

**Goal:** Alex gets the full **single-screen** experience: **Tailwind** dark theme and **Direction 9** layout, **empty / loading / error** patterns, **add / toggle / delete** with **honest** mutation feedback, **keyboard** and **responsive** support, and **server-aligned** list state after refresh.

**FRs covered:** **FR1–FR16**, **FR26**; **FR14** as the end-to-end user outcome together with Epic 2.

**Testing (mandatory in-epic):**

- **Component tests:** add or update **Vitest** (or project-standard) **component tests as you build** each meaningful UI unit (**TodoApp**, **TodoList**, **TodoItem**, **AddTodoForm**, error/loading/empty affordances, etc.)—co-located or mirrored per Architecture test placement rules.
- **E2E tests:** build on the **Playwright scaffold from Epic 1**—**add or extend specs whenever a new user journey** is implemented (e.g. open/load list, add todo, toggle complete, delete, empty state, error/retry path)—not a single end-of-epic dump.
- **CI:** extend the existing **E2E** job (or add stages) so **Playwright** runs the growing suite **against local dev servers** or **Compose** (Compose may require **Epic 4**; until then, orchestrate client + api in CI as documented).

**UX / NFR notes:** Delivers **UX-DR1–UX-DR12** and client-side **NFR-P1–P3**, **NFR-A1–A2**.

---

### Epic 4: Containerization, orchestration, and API health / readiness

**Goal:** The app runs as **versioned container images** with **Docker Compose** (API + static web), **persistent SQLite volume**, **non-root** runtimes, and **orchestrator health checks** aligned with Architecture. Operators can rely on **liveness** and **readiness** for deploy and demos.

**FRs covered:** **FR24** — implement **`GET /health`** (process up) and **`GET /ready`** (DB reachable / migrations applied as appropriate), wire **Dockerfile `HEALTHCHECK`** and **`docker-compose` `healthcheck:`** to these endpoints, and document **`docker compose up`**, volumes, and **`docker compose logs`**.

**Scope (non-exhaustive):**

- **`docker/api.Dockerfile`** and **`docker/web.Dockerfile`**: **multi-stage** builds, **non-root** `USER`, minimal runtime artifacts.
- **Root `docker-compose.yml`:** **`api`** (SQLite **volume** mount), **`web`** (serves **`client` `dist`**), **bridge network**, **env** from **`.env`**, **`depends_on`** with **`condition: service_healthy`** where required.
- **CI:** jobs to **build images** and optionally run **compose + smoke** (can reuse integration/E2E from Epics 2–3 as gates when available).

**Implementation notes:** Depends on **Epic 2** (API + DB behavior) and **Epic 3** (built client assets for **web** image). **FR25** logging to stdout remains primarily an **Epic 2** concern; Epic 4 ensures **Compose** surfaces logs via **`docker compose logs`**.

---

## Epic 1 (stories): Foundation, repo layout, and local delivery pipeline

### Story 1.1: Set up initial client and API from starter templates

As a **developer** (Jordan),
I want the **Vite + React + TypeScript** client and **Fastify** API **created from the Architecture-approved starters** with **lint, unit tests, and installable dependencies**,
So that **the repo matches the documented stack and every contributor gets the same baseline**.

**Acceptance Criteria:**

**Given** the repository root  
**When** I initialize **`client/`** per Architecture (**`npm create vite@latest client -- --template react-ts`**) and install dependencies  
**Then** **`npm run dev`** (or the package dev script) starts the client successfully  
**And** **`npm run build`** produces a production **`dist/`**  
**And** **`npm run test`** (or **`test:unit`**) runs **Vitest** (or equivalent) with at least one passing sample test  
**And** **ESLint** (or agreed linter) is configured and runnable via script on **`client/`**  
**When** I initialize **`api/`** per Architecture (**`npm init fastify api`** or equivalent) and install dependencies  
**Then** **`npm start`** / **`npm run dev`** starts the API without error  
**And** a **unit** test command runs with at least one passing sample test using the team-agreed runner  
**And** **ESLint** (or agreed linter) is configured and runnable via script on **`api/`**  
**And** the **`api/`** layout remains compatible with **Architecture** (`routes/`, `plugins/` autoload style as applicable)  
**And** **Node ≥ 20** is stated in **`client/`** or root README  

---

### Story 1.2: Root `.gitignore` and repository hygiene

As a **developer**,
I want a **root `.gitignore` suited to Node, Vite, Fastify, SQLite, and Playwright**,
So that **secrets, build output, local databases, and test artifacts never get committed by mistake**.

**Acceptance Criteria:**

**Given** **`client/`** and **`api/`** from Story 1.1  
**When** I inspect the **root `.gitignore`**  
**Then** it excludes at minimum **`node_modules/`**, **`dist/`** (and other common build dirs), **`.env` / `.env.*`** (while **`.env.example`** remains committable), **SQLite files** (`*.db`, `*.sqlite*`), **logs**, **coverage**, **OS/editor cruft** (e.g. `.DS_Store`), and **Playwright output** (`playwright-report/`, `test-results/`, `blob-report/`, Playwright cache paths)  
**And** the rules are documented in one short comment block if anything is non-obvious to new contributors  

---

### Story 1.3: Root workspace, dev orchestration, and shared test scripts

As a **developer**,
I want **root-level scripts** to run **client + API together** and to run **all unit tests**,
So that **day-to-day work does not require juggling multiple terminals manually**.

**Acceptance Criteria:**

**Given** **`client/`** and **`api/`** from Story 1.1  
**When** I run the root **`dev`** script (e.g. **concurrently** or **npm-run-all**)  
**Then** both **client dev server** and **API dev process** start with documented ports  
**And** a root **`test`** or **`test:unit`** script runs **client** and **api** unit suites in one invocation (fail-fast or aggregated exit code documented)  
**And** optional **npm workspaces** (or documented alternative) wire **`client`** and **`api`** without breaking independent package scripts  
**And** **`.env.example`** exists at root and/or per package with **only non-secret placeholders** matching Architecture env names where known (**`VITE_*`**, **`PORT`**, **`DATABASE_PATH`**, **`CORS_ORIGIN`**, etc.)  

---

### Story 1.4: Playwright E2E scaffold and green CI job

As a **developer**,
I want an **`e2e/`** package with **Playwright** configured and a **minimal passing spec**,
So that **CI proves the E2E harness works before product journeys are added in Epic 3**.

**Acceptance Criteria:**

**Given** the repository with **`client/`** and **`api/`**  
**When** I open **`e2e/`**  
**Then** **`playwright.config.ts`**, **`@playwright/test`** dependency, and a **`test:e2e`** script (root or workspace) exist  
**And** at least **one minimal spec** runs green locally (e.g. smoke against **`about:blank`** or a static placeholder) so **`playwright test`** exits **0**  
**And** **README** documents **`npx playwright install`** (or CI equivalent) for browser binaries  
**And** **CI** includes a job that **installs Playwright browsers** per vendor docs and runs **`test:e2e`** successfully  

---

### Story 1.5: README and fresh-clone bootstrap

As a **developer**,
I want a **complete README** and a **bootstrap script** (or documented one-liner),
So that **a new machine can go from clone to first successful dev + unit + E2E scaffold run without tribal knowledge**.

**Acceptance Criteria:**

**Given** a machine with **Node ≥ 20**  
**When** I run the documented **bootstrap** steps (e.g. **`npm install`** at root and in packages, copy **`.env.example`**, `playwright install`)  
**Then** **`dev`**, **`test`/`test:unit`**, **`test:e2e`**, and **`client` production build** all succeed per README  
**And** README explicitly states that **Docker / Compose** and **todo API integration tests** are **out of scope** for Epic 1 (pointer only—no duplicate setup instructions)  
**And** README lists **prerequisites** and **troubleshooting** for common failures (wrong Node version, missing Playwright browsers)  

---

## Epic 2 (stories): Reliable todo API, persistence, and HTTP integration tests

### Story 2.1: SQLite database, Drizzle schema, and migrations for `todos`

As a **developer**,
I want **`todos` persisted in SQLite** via **Drizzle** with **versioned migrations**,
So that **todo data survives process restarts** per **NFR-R1** and matches the Architecture data model.

**Acceptance Criteria:**

**Given** the **`api/`** service  
**When** I apply migrations (or documented **`drizzle-kit`** workflow) against a configured **`DATABASE_PATH`**  
**Then** a **`todos`** table exists with **snake_case** columns in SQLite and fields **id**, **text**, **completed**, **created_at**, **updated_at** (naming aligned with Architecture)  
**And** **`updated_at`** is set on create and intended to update on mutations in later stories  
**And** the schema is shaped so a future **`user_id`** (or tenant key) can be added **without** breaking core todo semantics (**NFR-SC1**)  
**And** no **liveness/readiness** HTTP routes are required for this story (**Epic 4**)  

---

### Story 2.2: List and create todos via REST with validation and integration tests

As a **client application** (Sam),
I want **`GET` (list)** and **`POST` (create)** todos with **consistent JSON** and **clear validation errors**,
So that **the UI can load and add tasks reliably** (**FR17–FR19**, **FR22**).

**Acceptance Criteria:**

**Given** a running API with database migrated  
**When** I **`GET`** the chosen list endpoint (single prefix **`/todos` or `/api/todos`**—**locked in this story** and documented)  
**Then** I receive **JSON** matching Architecture (**camelCase** fields, keyed **`todos`** array or documented contract) including **`createdAt`** and **`updatedAt`** as **ISO 8601 UTC** strings  
**When** I **`POST`** a valid todo body  
**Then** the todo is **persisted** and returned with a stable **id**  
**When** I **`POST`** an invalid body (e.g. over length, missing text)  
**Then** I receive **400** with the **standard error envelope** `{ "error": { "code", "message", "details?" } }`  
**And** **`api/test/integration/`** tests cover **happy list**, **happy create**, and **validation failure** using **`fastify.inject`** (or equivalent) against a **test database**  
**And** **FR25**: failures log via **structured logging** (e.g. **Pino**) to **stdout** without leaking stack traces to clients (**NFR-S3**)  

---

### Story 2.3: Update completion and delete todos with 404 semantics and integration tests

As a **client application**,
I want **`PATCH` (or `PUT`)** to toggle completion and **`DELETE`** by id with **404** when missing,
So that **users can complete, uncomplete, and remove todos** (**FR20**, **FR21**, **FR23**) with predictable outcomes.

**Acceptance Criteria:**

**Given** at least one todo exists in the database  
**When** I **toggle `completed`** via the documented update endpoint  
**Then** the stored row updates, **`updatedAt`** changes, and the response returns the **full todo** entity  
**When** I **DELETE** an existing id  
**Then** the todo is removed and the response follows the **single chosen convention** (**204** *or* **200**—chosen here and documented in OpenAPI)  
**When** I **PATCH** or **DELETE** a non-existent id  
**Then** I receive **404** with the **standard error envelope**  
**And** integration tests cover **toggle**, **delete**, **404** paths, and **persistence** across sequential calls  
**And** input remains bounded per **NFR-S1** (max length / payload limits)  

---

### Story 2.4: OpenAPI contract, CORS configuration, and CI job for API integration tests

As an **operator/developer**,
I want a **published OpenAPI spec** and **CI running integration tests** on every change,
So that **the API contract stays reviewable** and **regressions are caught automatically**.

**Acceptance Criteria:**

**Given** all todo routes from prior stories  
**When** I start the API in **development** with swagger enabled (per Architecture)  
**Then** **OpenAPI** reflects **paths, methods, schemas, statuses**, and the **error envelope**—including the **locked path prefix** and **DELETE** response convention  
**And** **CORS** is configured via **`CORS_ORIGIN`** (not wide-open for production defaults)  
**And** CI includes a dedicated **API integration test** job (extends Epic 1 CI) that runs on PRs  
**And** **FR25** remains satisfied for server-side diagnostics in integration failures  

---

## Epic 3 (stories): Calm, complete todo experience in the browser

### Story 3.1: Tailwind design tokens and typography baseline

As a **user** (Alex),
I want a **dark-first, calm visual baseline** with **readable typography**,
So that **the app feels professional and easy to scan** (**UX-DR1**, **UX-DR12**, emotional goals).

**Acceptance Criteria:**

**Given** the **`client/`** app  
**When** I add **Tailwind** per Vite docs with **`content`** covering `src/**`  
**Then** **`tailwind.config`** defines **semantic layers**: page/panel/row surfaces; **primary / secondary / muted** text; **teal accent** (reference **#2dd4bf**); **error** hue; **completed** text token distinct from **disabled** controls (**UX-DR9** precursor)  
**And** **WCAG-oriented contrast** is called out for critical pairs (body, buttons, errors, focus) with notes for implementation verification (**UX-DR6**)  
**And** at least **one component test** proves a tokenized surface renders (e.g. shell or placeholder)  

---

### Story 3.2: API client, TanStack Query, and list loading with loading/error/retry

As a **user**,
I want the **todo list to load** with **immediate loading feedback** and **recoverable errors**,
So that **I never stare at a blank void** and can **retry** when something fails (**FR10**, **FR11**, **NFR-P2**, **UX-DR5**).

**Acceptance Criteria:**

**Given** the API is reachable via **`VITE_`-prefixed base URL**  
**When** the app mounts  
**Then** **TanStack Query** fetches the todo list using a stable **`queryKey`** (e.g. **`['todos']`**)  
**And** **loading** is shown in the **list region immediately** (skeleton or copy—not an empty panel) (**NFR-P2**, **UX-DR5**)  
**When** the request fails  
**Then** a **QueryErrorBanner** (or equivalent) shows **plain language** and a **Retry** action (**UX-DR3**, **UX-DR5**)  
**And** errors are mapped through a **single module** (e.g. **`mapApiError`**)—**no raw JSON/stack** in UI (**NFR-S3**, **UX-DR5**)  
**And** **component tests** cover loading and error+retry states (mocked fetch/Query)  
**And** **E2E**: extend Playwright with a spec for **list load** (happy path against running API **or** documented test double strategy)  

---

### Story 3.3: TodoApp shell, Direction 9 layout, and empty state

As a **user**,
I want **one primary screen** with **list above** and **composer below**,
So that **I can scan tasks and capture new ones with minimal thumb/pointer travel** (**FR1**, **FR3**, **FR9**, **UX-DR2**, **UX-DR8**).

**Acceptance Criteria:**

**Given** the styled app shell  
**When** there are **zero** todos from the API  
**Then** **`TodoApp`** renders **title → scrollable list region (`flex-1`, `min-h-0`) → bottom `AddTodoForm`** with a **top border** on the composer (**Direction 9**, **UX-DR2**)  
**And** **empty state** copy is short and practical; **composer stays visible** (**UX-DR8**)  
**And** **semantic structure** supports headings/list regions for assistive tech (**NFR-A2**)  
**And** **component tests** cover empty layout  
**And** **E2E**: **empty list** journey  

---

### Story 3.4: Add todo flow with double-submit protection

As a **user**,
I want to **add todos quickly** without **duplicate ghosts**,
So that **flaky networks do not corrupt my list** (**FR2**, **FR13**, **NFR-P1**, **UX-DR4**).

**Acceptance Criteria:**

**Given** the bottom **`AddTodoForm`** (**Enter** submits when focused—**UX-DR12** interaction)  
**When** I submit valid text  
**Then** the **primary Add** uses the **teal** hierarchy (**UX-DR4**) and shows **in-flight disabled** state (**opacity / cursor**)  
**And** **duplicate submit** is prevented while the mutation is pending (**FR13**)  
**When** create succeeds  
**Then** the list reflects **server truth** (invalidate/update Query cache) (**FR26**)  
**When** create fails  
**Then** an **inline or banner** error appears with actionable copy (**FR12**, **UX-DR5**)  
**And** **component tests** cover submit disabled + success path (mocked API)  
**And** **E2E**: **add todo** journey  

---

### Story 3.5: Todo rows — complete, uncomplete, delete, metadata, and styling

As a **user**,
I want **obvious done vs active** tasks and **clear delete**,
So that **I can manage my list at a glance** (**FR4–FR8**, **FR7**, **UX-DR3**, **UX-DR9**, **UX-DR10**).

**Acceptance Criteria:**

**Given** todos in the list  
**When** I toggle **complete**  
**Then** **checkbox** is **labeled** with todo text (or **`aria-labelledby`**) (**UX-DR6**)  
**And** **completed** styling uses **strikethrough + muted readable** token—not disabled-control styling (**UX-DR9**, **FR8**)  
**And** **`createdAt` / `updatedAt`** render as **small secondary** metadata (**UX-DR10**, **FR7**)  
**When** I **delete**  
**Then** **Delete** is **ghost/outline** with visible **focus-visible** ring (**UX-DR4**) and an **accessible name**  
**And** **component tests** cover **TodoItem** states  
**And** **E2E**: **mark complete**, **mark active again**, **delete** journeys  

---

### Story 3.6: Responsive layout, keyboard flows, and motion preferences

As a **user**,
I want the app to work on **phone and desktop** with **keyboard-only** core flows,
So that **I am not blocked by viewport or input mode** (**FR15**, **FR16**, **NFR-A1**, **UX-DR6**, **UX-DR7**).

**Acceptance Criteria:**

**Given** narrow and wide viewports  
**Then** **no horizontal scroll** on primary flows; **~44px** touch targets on **Add** and row actions (**UX-DR7**, **FR15**)  
**And** **focus order** is **title → list (per row) → composer** (**FR16**, **UX-DR6**)  
**And** **focus rings** are high-contrast on dark surfaces  
**And** **`prefers-reduced-motion`** is honored for transitions/spinners (**UX-DR6**)  
**And** **component** and/or **E2E** checks document the keyboard path (at minimum manual checklist in README if automation is deferred)  

---

### Story 3.7: End-to-end trust — reload, server alignment, and error journeys

As a **user**,
I want **reload to show the truth** and **errors to recover cleanly**,
So that **I trust this scratchpad** (**FR14**, **FR26**, **FR11–FR12**, edge journeys).

**Acceptance Criteria:**

**Given** a populated list from the API  
**When** I **reload** the page  
**Then** the rendered list **matches persisted todos** for the deployment (**FR14**, **FR26**)  
**When** a **mutation** fails mid-flow  
**Then** the UI **does not silently drop rows**; user sees **actionable** feedback (**FR12**)  
**And** **E2E** covers **reload persistence** and at least **one mutation/list failure + recovery** path (per Architecture minimum bar)  
**And** **`ux-design-directions.html`** remains a **reference-only** artifact (**UX-DR11**)  

---

## Epic 4 (stories): Containerization, orchestration, and API health / readiness

### Story 4.1: Liveness and readiness HTTP endpoints

As an **operator** (Jordan),
I want **`GET /health`** and **`GET /ready`** on the API,
So that **orchestrators and Compose can tell when the service and DB are actually usable** (**FR24**).

**Acceptance Criteria:**

**Given** the running API  
**When** I call **`GET /health`**  
**Then** it returns **success** when the process is up (liveness)  
**When** I call **`GET /ready`**  
**Then** it succeeds only when **SQLite is reachable** and **migrations/schema expectations** are met (per Architecture readiness definition)  
**And** responses are safe to expose to **load balancers** / **Compose** (no sensitive internals in body)  
**And** **integration tests** (or focused route tests) cover **health** and **ready** behavior  

---

### Story 4.2: Multi-stage Dockerfiles for API and static web

As an **operator**,
I want **production-oriented Dockerfiles** for **API** and **static client**,
So that **images are small, reproducible, and run as non-root** (Architecture).

**Acceptance Criteria:**

**Given** **`docker/api.Dockerfile`** and **`docker/web.Dockerfile`**  
**When** I build images for **`api`** and **`web`**  
**Then** both use **multi-stage** builds and run as a **non-root** `USER` in the final stage  
**And** **`web`** image serves **`client` `dist`** via **nginx** or equivalent static server per Architecture  
**And** **`api`** image includes only runtime artifacts needed for Fastify + native deps (**better-sqlite3**) as applicable  
**And** README documents **build args** affecting **`VITE_API_BASE_URL`** (or equivalent) for **`web`**  

---

### Story 4.3: Docker Compose stack with healthchecks and SQLite volume

As an **operator**,
I want **`docker compose up`** to start **API + web** with **persistent SQLite** and **healthy dependencies**,
So that **demos and local prod-like runs match Architecture** (**FR24**).

**Acceptance Criteria:**

**Given** **`docker-compose.yml`** at repo root  
**When** I run **`docker compose up --build`**  
**Then** **`api`** mounts a **named or bind volume** for **`DATABASE_PATH`** and survives **container restart** with data intact (documented)  
**And** **`web`** depends on **`api`** with **`depends_on`** and **`service_healthy`** where required  
**And** **`HEALTHCHECK`** / compose **`healthcheck:`** call **`/health`** / **`/ready`** appropriately  
**And** **bridge network** and **env** from **`.env`** are documented (no secrets committed)  
**And** **`docker compose logs`** surfaces **Pino** stdout from **api** (**FR25** visibility in ops story)  

---

### Story 4.4: Container CI and documentation for deploy-shaped workflows

As an **operator**,
I want **CI to build images** (and optionally run **compose smoke**),
So that **container regressions are caught before merge**.

**Acceptance Criteria:**

**Given** the Docker and Compose artifacts  
**When** CI runs on PRs  
**Then** **`docker build`** (or **`docker compose build`**) succeeds for **`api`** and **`web`**  
**And** optional **compose smoke** step is documented (run **health** checks or minimal E2E against compose—may reuse Epic 3 Playwright when configured)  
**And** README adds a **“Run with Docker”** section: prerequisites, **`docker compose up`**, ports, volumes, troubleshooting  
**And** **NFR-S2** is documented for non-local deployments (**TLS** termination at proxy or platform)  

---

---

_BMad **create-epics-and-stories** workflow: **complete** (`step-04-final-validation` in frontmatter)._

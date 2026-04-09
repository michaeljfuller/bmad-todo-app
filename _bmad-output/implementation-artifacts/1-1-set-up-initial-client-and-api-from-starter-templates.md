# Story 1.1: Set up initial client and API from starter templates

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **developer** (Jordan),
I want the **Vite + React + TypeScript** client and **Fastify** API **created from the Architecture-approved starters** with **lint, unit tests, and installable dependencies**,
so that **the repo matches the documented stack and every contributor gets the same baseline**.

## Acceptance Criteria

1. **Given** the repository root **when** `client/` is initialized per Architecture (`npm create vite@latest client -- --template react-ts`) and dependencies are installed **then** the client dev script starts the app successfully **and** production build produces `dist/` **and** a unit test command runs with at least one passing sample test (Vitest or equivalent) **and** ESLint (or the template’s agreed linter) is configured and runnable via script on `client/`.
2. **Given** the repository root **when** `api/` is initialized per Architecture (`npm init fastify api` or equivalent) and dependencies are installed **then** `npm start` / `npm run dev` starts the API without error **and** a unit test command runs with at least one passing sample test using the team-agreed runner **and** ESLint (or agreed linter) is configured and runnable via script on `api/` **and** the `api/` layout stays compatible with Architecture (`routes/`, `plugins/`, `@fastify/autoload` style as generated).
3. **Node ≥ 20** is stated in `client/` README, root README, or `package.json` `engines` (at least one visible place for contributors).

## Tasks / Subtasks

- [x] **Client scaffold** (AC: 1)
  - [x] From repo root: `npm create vite@latest client -- --template react-ts` (non-interactive flags if the tool prompts).
  - [x] `cd client && npm install`; confirm `npm run dev`, `npm run build`.
  - [x] Add **Vitest** (and React Testing Library if useful) so `npm run test` or `npm run test:unit` runs ≥1 passing sample test.
  - [x] Ensure **ESLint** runs via script (extend Vite/React defaults if present).
- [x] **API scaffold** (AC: 2)
  - [x] From repo root: `npm init fastify api` (accept defaults that produce `plugins/`, `routes/`, autoload).
  - [x] `cd api && npm install`; confirm `npm start` / dev script from generated `package.json`.
  - [x] Add minimal **unit** test setup (Node test runner, Vitest, or other—**one** choice) with ≥1 passing test.
  - [x] Ensure **ESLint** runs via script on `api/` (match whatever the generator provides or add minimal config).
- [x] **Node version visibility** (AC: 3)
  - [x] Document **Node ≥ 20** in README and/or `engines` in the relevant `package.json`(s).

## Dev Notes

### Scope boundaries (do not do in this story)

Per [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 1]: **Out of scope** for 1.1: root `.gitignore` (Story 1.2), root workspaces / concurrent `dev` / shared `test` scripts (1.3), **`e2e/`** Playwright (1.4), full bootstrap README (1.5), **`docker/`**, **`docker-compose.yml`**, **`/health`** / **`/ready`**, todo routes, Drizzle/SQLite, CORS wiring, API integration tests, and OpenAPI. Avoid premature work that duplicates later stories.

### Architecture compliance

- **Starters:** [Source: `_bmad-output/planning-artifacts/architecture.md` — Starter Template Evaluation]  
  - Client: **Vite + React + TypeScript** (`react-ts`).  
  - API: **create-fastify** (`npm init fastify api`).  
  - Run from **repository root**; verify **Node ≥ 20** before generators.
- **Layout:** [Source: `_bmad-output/planning-artifacts/architecture.md` — Structure Patterns]  
  - `client/` — Vite app under `src/`.  
  - `api/` — preserve **`routes/`**, **`plugins/`** and autoload conventions from the generator; do not flatten into a custom layout.
- **Fastify language:** Architecture notes the default scaffold may be **JavaScript-first**; **TypeScript migration is optional in later work**. For 1.1, **do not** fight the generator—if output is `.js`, keep it until a dedicated story refactors to TS.
- **Future API/todo rules** (for awareness only—**not** implemented here): single REST prefix `/todos` or `/api/todos`; camelCase JSON; error envelope `{ "error": { "code", "message", "details?" } }`; Pino, Drizzle, integration tests under `api/test/integration/`—all land in **Epic 2+**.

### Project structure notes

- Repo currently has **no** `package.json` at root ([Source: `_bmad-output/project-context.md` — `codebase_status: planning_only`]). This story **creates** `client/package.json` and `api/package.json` only; root `package.json` / workspaces are **Story 1.3**.
- After scaffold, **pin exact dependency versions** in each `package.json` and commit lockfiles as your workflow requires ([Source: `_bmad-output/project-context.md` — Technology Stack]).

### Testing requirements

- **Client:** Vitest is the natural fit with Vite; co-locate `*.test.ts` / `*.test.tsx` or use `__tests__/`—**pick one** for `client/` and document in a one-line dev note if non-obvious ([Source: `_bmad-output/project-context.md` — Testing Rules]).
- **API:** At least one **unit** test with a **passing** assertion; runner choice is team preference ([Source: epics Story 1.1 AC]).
- **Not required yet:** API integration tests, Playwright, CI YAML ([Source: epics Epic 1 out-of-scope]).

### Library / tooling hints

- **Vite 6.x / Vitest 3.x** are current major lines as of early 2026; run `npm create vite@latest` and `npm init fastify` to get supported defaults, then **pin** versions in `package.json` after install.
- If `npm create vite` offers eslint optional setup, accept it to reduce manual ESLint wiring.

### UX / product

No UI product requirements in this story beyond a working Vite default page. **Tailwind**, **Design Direction 9**, and todo components are **Epic 3** ([Source: epics — Epic 3 / UX-DR*]).

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Story 1.1, Epic 1 goal & out-of-scope]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — Starter commands, Structure Patterns, Project Structure & Boundaries, Implementation sequence step 1]
- [Source: `_bmad-output/project-context.md` — stack table, naming, testing co-location, `engines` / pinning]

## Dev Agent Record

### Agent Model Used

Cursor agent (Amelia / dev-story workflow), 2026-04-09.

### Debug Log References

- `npx create-fastify@latest` without a path initially wrote Fastify files to repo root; relocated into `api/` to match architecture (`client/`, `api/`).

### Completion Notes List

- **AC1:** `client/` from `npm create vite@latest client -- --template react-ts`; `npm run build` → `client/dist/`; `npm run test` (Vitest) — `src/App.test.tsx` co-located with `App.tsx`; `npm run lint` (template ESLint).
- **AC2:** `api/` from create-fastify (equivalent to `npm init fastify` scaffold): `app.js`, `plugins/`, `routes/`, `@fastify/autoload`; `npm test` (Node built-in `node:test`, 3 passing); `npm run lint` via `eslint.config.mjs` + `npm run lint`; `npm start` / `npm run dev` verified (HTTP 200 on `/`).
- **AC3:** `engines.node` `>=20` in `client/package.json` and `api/package.json`; Node 20+ called out in root `README.md`, `client/README.md`, `api/README.md`.
- **`_bmad-output/project-context.md`:** `codebase_status` → `scaffolded`; technology stack table updated with pinned stack summary.

### File List

- `README.md` (root)
- `client/` — full Vite react-ts scaffold plus: `package.json`, `package-lock.json`, `vite.config.ts`, `eslint.config.js`, `tsconfig*.json`, `index.html`, `src/*` (including `App.test.tsx`, `test-setup.ts`), `public/*`, `.gitignore`, `README.md`
- `api/` — Fastify scaffold: `package.json`, `package-lock.json`, `app.js`, `eslint.config.mjs`, `.gitignore`, `README.md`, `plugins/*.js`, `routes/**/*.js`, `test/**/*.js`

### Change Log

- 2026-04-09: Story 1.1 — scaffolded `client/` (Vite + React + TS + Vitest + ESLint) and `api/` (Fastify + autoload + Node test + ESLint); Node ≥20 documented; relocated mistaken root Fastify files into `api/`; updated `project-context.md` stack status.

---

**Story completion status**

- **Status:** review  
- **Note:** Ready for code review; run full test/lint in `client/` and `api/` before merge.

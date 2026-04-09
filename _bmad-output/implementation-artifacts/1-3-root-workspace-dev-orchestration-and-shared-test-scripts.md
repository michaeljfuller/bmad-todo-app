# Story 1.3: Root workspace, dev orchestration, and shared test scripts

Status: review

<!-- Ultimate context engine analysis completed - comprehensive developer guide created -->

## Story

As a **developer**,
I want **root-level scripts** to run **client + API together** and to run **all unit tests**,
So that **day-to-day work does not require juggling multiple terminals manually**.

## Acceptance Criteria

**Given** **`client/`** and **`api/`** from Story 1.1  
**When** I run the root **`dev`** script (e.g. **concurrently** or **npm-run-all**)  
**Then** both **client dev server** and **API dev process** start with documented ports  
**And** a root **`test`** or **`test:unit`** script runs **client** and **api** unit suites in one invocation (fail-fast or aggregated exit code documented)  
**And** optional **npm workspaces** (or documented alternative) wire **`client`** and **`api`** without breaking independent package scripts  
**And** **`.env.example`** exists at root and/or per package with **only non-secret placeholders** matching Architecture env names where known (**`VITE_*`**, **`PORT`**, **`DATABASE_PATH`**, **`CORS_ORIGIN`**, etc.)

## Tasks / Subtasks

- [x] Add root `package.json` with `workspaces: ["client", "api"]` (or equivalent documented layout) so `npm install` at root installs workspace deps where applicable (AC: workspaces)
- [x] Add dev dependency **concurrently** (or **npm-run-all**) and root script **`dev`** that runs `client` and `api` dev commands in parallel; document default ports (e.g. Vite **5173**, API per **`PORT`**) in README or root comment (AC: dev script)
- [x] Add root **`test`** or **`test:unit`** that runs both packages’ unit test scripts; document whether first failure stops the rest or all run with aggregated exit code (AC: shared tests)
- [x] Ensure **`npm run dev`** / **`npm run test`** from **`client/`** and **`api/`** still work standalone (no regression to per-package workflows) (AC: independent package scripts)
- [x] Add or align **`.env.example`**: at minimum root **or** per-package files listing **`VITE_API_BASE_URL`** (or agreed `VITE_*` name), **`PORT`**, **`DATABASE_PATH`**, **`CORS_ORIGIN`**, **`LOG_LEVEL`**, **`NODE_ENV`** — placeholders only, no secrets (AC: env example)
- [x] Document proxy vs explicit API URL for local dev (Architecture: “wire dev proxies or env”) in README stub or Story 1.5 prep — at least one sentence in root README or `.env.example` comments if README not fully expanded yet (supporting AC)

## Dev Notes

### Prerequisites and order

- **Depends on:** Story **1.1** (scaffolded `client/` + `api/`) and **1.2** (root `.gitignore`). Do not assume Docker, Compose, or todo API routes (Epic 1 explicitly excludes them).
- **No prior story files** exist yet under `_bmad-output/implementation-artifacts/`; align with **Epic 1** stories **1.1** and **1.2** in `epics.md` when implementing.

### Architecture compliance

- **Repo layout:** Root **`package.json`** optional but recommended for **workspaces + root scripts** (`dev`, `test`). Structure must stay **`client/`** + **`api/`**; **`e2e/`** is added in Story **1.4** — if root workspaces are introduced now, leave room to add **`e2e`** to `workspaces` in 1.4 without renaming packages. [Source: `_bmad-output/planning-artifacts/architecture.md` — Project Structure & Boundaries, Infrastructure & Deployment]
- **Configuration:** Client exposes only **`VITE_*`** to the browser. API: **`PORT`**, **`DATABASE_PATH`**, **`CORS_ORIGIN`**, log level, **`NODE_ENV`**. [Source: `_bmad-output/planning-artifacts/architecture.md` — Infrastructure & Deployment; `_bmad-output/project-context.md` — Env]
- **Development:** Run Vite and Fastify **concurrently**; document **proxy vs explicit origin** for SPA → API. [Source: architecture.md — Starter Template Evaluation, Infrastructure & Deployment]
- **Out of scope for this story:** `docker/`, `docker-compose.yml`, liveness/readiness routes, API integration test suites, Playwright product journeys (per Epic 1 epic description in `epics.md`).

### Technical requirements (guardrails)

- Prefer **`npm workspaces`** at root with **`client`** and **`api`** as workspace packages; alternative (e.g. root scripts that `npm run` in subdirs without workspaces) is acceptable if **documented** and keeps single-command `dev` + `test`.
- Root **`dev`:** must start both processes; use **`concurrently`** with named prefixes (e.g. `[client]`, `[api]`) for readable logs, or equivalent.
- Root **`test` / `test:unit`:** invoke each package’s existing unit test script (Vitest or generator default); **document** exit-code behavior (fail-fast vs run-all).
- **`.env.example`:** mirror names from architecture (`client/.env.example` shows `VITE_API_BASE_URL` or team-chosen `VITE_*`; `api/.env.example` shows `PORT`, `DATABASE_PATH`, `CORS_ORIGIN`, etc.). Root `.env.example` may aggregate compose-oriented vars later (Epic 4); for this story, **non-secret placeholders** and consistency with `project-context.md` matter more than completeness of Compose vars.

### File structure requirements

- **Touch:** repository root **`package.json`** (new or extended), root **`.env.example`** (if consolidating env docs), optionally small edits to **`client/package.json`** / **`api/package.json`** only if required for workspace names or script aliases.
- **Do not** add **`docker/`** or **`docker-compose.yml`** here.

### Testing requirements

- After changes, from repo root: **`npm run test`** (or `test:unit`) runs **both** client and API unit suites successfully.
- Manually verify **`npm run dev`** starts both servers; no requirement for HTTP integration tests in this story (Epic 2).

### Library / tooling notes

- **concurrently** (current stable on npm) is a common choice; **npm-run-all** (`run-p`) is an alternative. Pin versions in root `package.json` when added.
- Node **≥ 20** remains the project bar (state in README in Story 1.5 if not already in 1.1).

### Project context reference

- Follow **`_bmad-output/project-context.md`** for env naming, **`VITE_*`** client rule, API env vars, and **CI bar** expectations once pipelines exist.
- **REST base path** (`/todos` vs `/api/todos`) is **not** decided in this story; `.env.example` should not hard-code a path that contradicts a future story — use a placeholder comment if needed.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 1, Story 1.3]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — Project Structure (tree), Infrastructure & Deployment, Development Workflow Integration]
- [Source: `_bmad-output/project-context.md` — Technology Stack, Critical Implementation Rules, Development Workflow Rules]

## Dev Agent Record

### Agent Model Used

gpt-5.3-codex-low (Amelia / bmad-agent-dev)

### Debug Log References

- `npm install` (repo root)
- `npm run test` (repo root)
- `npm run test` (`client/`)
- `npm run test` (`api/`)
- `npm run lint` (`client/`)
- `npm run lint` (`api/`)

### Completion Notes List

- Added root workspace orchestration via `package.json` with `workspaces: ["client", "api"]`.
- Added root `dev` script using `concurrently` with named prefixes `[client]` and `[api]`.
- Added root `test` and `test:unit` scripts; documented fail-fast behavior in `README.md`.
- Added root `.env.example` with non-secret placeholders: `VITE_API_BASE_URL`, `PORT`, `DATABASE_PATH`, `CORS_ORIGIN`, `LOG_LEVEL`, `NODE_ENV`.
- Documented explicit API URL vs proxy approach for local dev in `README.md` and `.env.example` comments.
- Verified shared and standalone workflows with passing test and lint commands for both packages.

### File List

- `package.json`
- `package-lock.json`
- `.env.example`
- `README.md`
- `_bmad-output/implementation-artifacts/1-3-root-workspace-dev-orchestration-and-shared-test-scripts.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

### Change Log

- 2026-04-09: Implemented Story 1.3 root workspace orchestration, shared test scripts, env examples, and documentation updates; validated with root + package-level tests and lint.

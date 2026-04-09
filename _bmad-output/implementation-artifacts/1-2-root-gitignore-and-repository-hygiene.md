# Story 1.2: Root `.gitignore` and repository hygiene

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **developer**,
I want a **root `.gitignore` suited to Node, Vite, Fastify, SQLite, and Playwright**,
so that **secrets, build output, local databases, and test artifacts never get committed by mistake**.

## Acceptance Criteria

1. **Given** `client/` and `api/` from Story 1.1 **when** the root `.gitignore` is inspected **then** it excludes at minimum: `node_modules/`, `dist/` and other common build outputs, `.env` / env files with secrets (see Dev Notes for `.env.example` exception), SQLite artifacts (`*.db`, `*.sqlite*`), logs, coverage output, OS/editor cruft (e.g. `.DS_Store`), and Playwright output (`playwright-report/`, `test-results/`, `blob-report/`, Playwright cache paths under the repo such as `.cache/playwright` or vendor-documented equivalents).
2. **Non-obvious rules** are explained in a **short comment block** at the top (or above the relevant section) so new contributors understand intent without reading the whole epic doc.

## Tasks / Subtasks

- [ ] **Create root `.gitignore`** at repository root (same level as future `client/`, `api/`) — single file for the whole monorepo-style layout ([Source: `_bmad-output/planning-artifacts/architecture.md` — Project Structure]) (AC: 1–2).
- [ ] **Minimum pattern set** (AC: 1)
  - [ ] `node_modules/` (root and applies recursively).
  - [ ] Build / bundle: `dist/`, `build/`, `.vite/` (Vite cache), `*.local` if used for generated local bundles (optional—only if your scaffold creates them).
  - [ ] **Secrets:** `.env`, `.env.local`, `.env.*.local` — **and** verify **`.env.example` is NOT ignored** (use negation `!.env.example` if you use a broad `.env*` rule, or list explicit ignore patterns instead of `.env*`) ([Source: `_bmad-output/project-context.md` — Env]).
  - [ ] SQLite / local DB: `*.db`, `*.sqlite`, `*.sqlite3`, `*.db-journal`, `*.sqlite*-journal` / WAL sidecars if your tooling creates them (e.g. `*-shm`, `*-wal`) — align with how `better-sqlite3` / Drizzle will write files under `DATABASE_PATH` in later epics.
  - [ ] Logs: `logs/`, `*.log`, `npm-debug.log*`, `yarn-debug.log*`, `pnpm-debug.log*`.
  - [ ] Coverage / test artifacts: `coverage/`, `.nyc_output/`, `.vitest/` if created by Vitest coverage.
  - [ ] OS/IDE: `.DS_Store`, `Thumbs.db`, `.idea/`, `.vscode/` **or** keep `.vscode/` tracked if the team commits shared settings — **default for this project:** ignore `.DS_Store` and common junk; if you commit `.vscode/extensions.json` by policy, use selective ignores (document in comment block).
  - [ ] Playwright: `playwright-report/`, `test-results/`, `blob-report/`, and local browser cache dirs often under `.cache/ms-playwright` or `.cache/playwright` — include patterns that match [Playwright output dirs](https://playwright.dev/docs/test-reporters) for your chosen config.
- [ ] **Comments** (AC: 2): 3–8 lines grouping sections (dependencies, build, env, db, test/coverage, playwright, OS).
- [ ] **Sanity check:** `git check-ignore -v .env.example` must **not** list `.gitignore` as ignoring it; `git check-ignore -v .env` **should** ignore a dummy `.env` if you create one locally (remove after check).

## Dev Notes

### Scope boundaries (do not do in this story)

Per [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 1]: **Out of scope:** root `package.json` / workspaces (Story 1.3), Playwright package scaffold (1.4), full README bootstrap (1.5), Docker, health routes, API behavior. This story is **only** root `.gitignore` (+ optional tiny hygiene only if required to satisfy AC—e.g. do **not** add `client/.gitignore` duplication that fights the root file without reason).

### Dependency on Story 1.1

[Source: `_bmad-output/implementation-artifacts/1-1-set-up-initial-client-and-api-from-starter-templates.md`]: `client/` and `api/` must exist from 1.1. If 1.1 is not merged yet, still author `.gitignore` at root so the first commit of app code is protected.

### Architecture compliance

- Root `.gitignore` is part of the **documented tree** ([Source: `_bmad-output/planning-artifacts/architecture.md` — `bmad-todo-app/` layout]).
- Future paths to keep uncommitted: **`api/db`** data files if developers point `DATABASE_PATH` inside the repo; **`data/`** if used for Compose SQLite volumes (Epic 4). Consider adding optional ignores: `data/`, `tmp/`, `.tmp/` — document in comments if added.

### Project context (must follow)

- **Env:** Client exposes only `VITE_*`; API uses `PORT`, `DATABASE_PATH`, `CORS_ORIGIN`, etc. — **never** commit real `.env` files ([Source: `_bmad-output/project-context.md` — Env]).
- **SQLite:** Local DB files must stay out of git; table name `todos` is irrelevant to ignore rules but confirms multiple `*.db` files may appear during dev/test.

### Previous story intelligence (1.1)

- Story 1.1 creates **`client/`** and **`api/`** with their own `package.json` files; **root** `.gitignore` applies to both trees—no need for per-package duplicate unless a generator adds a nested `.gitignore` that conflicts (prefer one root source of truth).
- Lockfiles (`package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`) should remain **tracked** — do **not** add `package-lock.json` to ignore.

### Testing requirements

No automated test required for `.gitignore` itself. **Manual verification:** `git status` after a local `npm install` and a sample `vite build` / test run should not show `node_modules`, `dist`, or coverage folders as untracked clutter worth committing (they should be ignored).

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Story 1.2, Epic 1 `.gitignore` bullet]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — Project Structure & Boundaries, tree with `.gitignore`]
- [Source: `_bmad-output/project-context.md` — Env, SQLite, Technology Stack]

## Dev Agent Record

### Agent Model Used

_(filled by dev agent)_

### Debug Log References

### Completion Notes List

### File List

_(filled by dev agent on completion)_

---

**Story completion status**

- **Status:** ready-for-dev  
- **Note:** Ultimate context engine analysis completed — comprehensive developer guide created.

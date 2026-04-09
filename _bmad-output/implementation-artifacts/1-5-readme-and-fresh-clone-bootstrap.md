# Story 1.5: README and fresh-clone bootstrap

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **developer**,
I want a **complete README** and a **bootstrap script** (or documented one-liner),
so that **a new machine can go from clone to first successful dev + unit + E2E scaffold run without tribal knowledge**.

## Acceptance Criteria

1. **Given** a machine with **Node ≥ 20** **when** a new contributor follows the documented **bootstrap** path (install dependencies, copy **`.env.example`** to **`.env`** where required, run **Playwright browser install** as documented) **then** **`dev`**, **`test`** or **`test:unit`**, **`test:e2e`**, and the **client production build** (`build` in `client/` or root script that delegates to it) all complete successfully as written.
2. **README** explicitly states **Docker**, **Docker Compose**, and **todo API HTTP integration tests** (**`api/test/integration/`**) are **out of scope for Epic 1**—brief pointer only (e.g. “see Epic 2 / Epic 4 in planning docs or future README sections”), **no** duplicate setup instructions that belong in those epics.
3. **README** lists **prerequisites** (Node ≥ 20, package manager choice if locked, optional **pnpm**/npm note) and a **troubleshooting** subsection for common failures: wrong Node version, missing Playwright browsers, missing **`.env`**, port conflicts—each with a concrete fix or command.

## Tasks / Subtasks

- [x] **Audit actual scripts** (AC: 1)
  - [x] Read root **`package.json`** (from Story 1.3) and **`client/`**, **`api/`**, **`e2e/`** package scripts; README commands must match **real** script names and working directory (root vs package).
  - [x] Document **exact** sequence: clone → install (root and/or workspaces per repo) → copy **`.env.example`** → `playwright install` (root or `e2e/` per config).
- [x] **Bootstrap automation** (AC: 1)
  - [x] Add **`bootstrap`** or **`setup`** script at root **or** document a **single copy-paste block** that performs install + env copy + `npx playwright install` (or `pnpm exec`)—pick one approach and keep it maintainable.
  - [x] Ensure bootstrap path is idempotent enough for re-runs (document if `playwright install` is safe to repeat).
- [x] **README structure** (AC: 1–3)
  - [x] Sections: **Prerequisites**, **Quick start** / **Bootstrap**, **Development** (`dev`), **Testing** (unit + E2E), **Build** (client production build), **Project layout** (short: `client/`, `api/`, `e2e/`), **Troubleshooting**, **Out of scope (Epic 1)**.
  - [x] Link or reference **`_bmad-output/planning-artifacts/architecture.md`** only if helpful; primary audience is repo README at root.
- [x] **Scope callouts** (AC: 2)
  - [x] One short paragraph: integration tests and Compose/Docker land in **Epic 2** and **Epic 4** respectively; avoid documenting `docker compose` or `api/test/integration` workflows here.
- [x] **Troubleshooting** (AC: 3)
  - [x] Wrong Node: how to check (`node -v`), requirement ≥ 20, link to nvm/fnm optional.
  - [x] Playwright: `npx playwright install` (or workspace equivalent) and note CI installs browsers separately.
  - [x] Env: which files to copy and typical placeholder keys (**`VITE_*`**, **`PORT`**, **`DATABASE_PATH`**, **`CORS_ORIGIN`** per Architecture).

## Dev Notes

### Epic cross-story context (Epic 1)

Stories **1.1–1.4** establish **`client/`**, **`api/`**, root **workspaces** and **`dev` / `test` / `test:e2e`**, **`.gitignore`**, and **Playwright** scaffold. This story **does not** re-implement those; it **documents and optionally scripts** the **combined** path for a **fresh clone**. If earlier stories are not merged yet, implement README against the **intended** final script names from [Source: `_bmad-output/planning-artifacts/epics.md` — Stories 1.3, 1.4] and adjust after merge if names differ.

### Architecture compliance

- **Repo layout:** [Source: `_bmad-output/planning-artifacts/architecture.md` — Project Structure & Boundaries] — **`client/`**, **`api/`**, **`e2e/`**, optional root **`package.json`** with workspaces; README should reflect this tree.
- **Local dev:** Architecture expects **concurrent** client + API; document **ports** (Vite default + API **`PORT`**) and whether **proxy vs explicit `VITE_API_BASE_URL`** is used—match **actual** `vite.config` / env from Story 1.1+.
- **CI:** Mention that CI runs lint/typecheck/unit/build/e2e per epic plan; **detailed CI YAML** can stay brief in README (“see `.github/workflows/`”) unless contributors must reproduce locally.
- **Future:** **`docker-compose.yml`**, **`GET /health`**, **`GET /ready`**, **`api/test/integration/`**—documented as **not** part of Epic 1 closure [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 1 out of scope].

### Project structure notes

- **`README.md`** lives at **repository root** next to **`package.json`** (when present).
- **`.env.example`:** May exist at root and/or under **`client/`** and **`api/`** [Source: architecture tree]; README should say **which** files to copy for local dev after Story 1.3.
- Do **not** add **`docker/`** or compose instructions in this story.

### Testing requirements

- **Manual verification:** Fresh clone simulation (clean `node_modules`, follow README only) is the **acceptance bar**; no new automated test required for README text unless team adds a doc lint.
- **Regression:** Running documented commands must not break **existing** unit or E2E scaffold from 1.4.

### Library / tooling hints

- **Playwright:** Browser install is **`npx playwright install`** or **`pnpm exec playwright install`** depending on package manager; monorepos often run from root with **`-C e2e`** or workspace filter—match **your** `e2e/package.json` [Source: epics Story 1.4].
- **Node:** Prefer documenting **`engines`** in root **`package.json`** if present (Story 1.1) and repeating **≥ 20** in README.

### Previous story intelligence

Only **Story 1.1** has a filled story file in `implementation-artifacts` at create-story time. It notes: **no root `package.json` in 1.1** (1.3 adds it); **Node ≥ 20** visibility; scaffolds in **`client/`** and **`api/`** only. For **1.5**, assume **1.2–1.4** complete the ignore file, root scripts, and **`e2e/`**—README must **integrate** all of that.

### UX / product

Contributor-facing documentation only; no UI changes.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 1 goal, Story 1.5, Stories 1.3–1.4, Epic 1 out of scope]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — Project Structure & Boundaries, Development Workflow Integration, Infrastructure]
- [Source: `_bmad-output/project-context.md` — CI bar, layout, env vars, Playwright location]

## Dev Agent Record

### Agent Model Used

Composer (Cursor agent) — Story 1.5 execution via `bmad-dev-story`.

### Debug Log References

_(none)_

### Implementation Plan

- **AC1:** Root `npm run bootstrap` = `npm install` + `scripts/bootstrap.mjs` (`.env.example` → `client/.env` & `api/.env` if missing) + `npm exec --workspace=e2e -- playwright install`. README documents manual equivalent and all of `dev`, `test` / `test:unit`, `test:e2e`, `npm run build --workspace client`.
- **AC2:** README **Out of scope (Epic 1)** — Docker/Compose → Epic 4; `api/test/integration/` → Epic 2; pointer to `epics.md`, no duplicate setup.
- **AC3:** **Troubleshooting** table — Node ≥ 20, Playwright install / CI `--with-deps`, env files and keys, ports.

### Completion Notes List

- ✅ `npm run test`, `npm run build --workspace client`, `npm run test:e2e` — all pass after changes.
- ✅ `npm run lint --workspace client` and `api` — pass.
- ✅ `npm run bootstrap` verified: creates env on first run, skips existing `.env` on re-run; `playwright install` repeatable.

### File List

- `README.md`
- `package.json`
- `scripts/bootstrap.mjs`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/1-5-readme-and-fresh-clone-bootstrap.md`

### Change Log

- **2026-04-09:** Story 1.5 — contributor README, root `bootstrap` script, env copy helper (`scripts/bootstrap.mjs`), sprint status `1-5` → `review`.

---

## Project context reference

Agents must follow **`_bmad-output/project-context.md`** for stack rules (Node, workspaces posture, testing placement). This story is **docs + optional npm scripts** only; do not change API or client behavior except script wiring if needed for **`bootstrap`**.

---

**Story completion status**

- **Status:** review  
- **Note:** README + `npm run bootstrap` aligned with workspace scripts; AC1–3 satisfied; regression suite green.

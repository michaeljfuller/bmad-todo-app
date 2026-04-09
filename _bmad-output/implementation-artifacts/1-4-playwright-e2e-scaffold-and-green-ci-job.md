# Story 1.4: Playwright E2E scaffold and green CI job

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **developer** (Jordan),
I want an **`e2e/`** package with **Playwright** configured and a **minimal passing spec**,
so that **CI proves the E2E harness works before product journeys are added in Epic 3**.

## Acceptance Criteria

1. **Given** the repository with **`client/`** and **`api/`** (from Stories 1.1–1.3)  
   **When** I open **`e2e/`**  
   **Then** **`playwright.config.ts`**, **`@playwright/test`** as a dependency, and a **`test:e2e`** entry point (root `package.json` script and/or `e2e/package.json` script—consistent with how workspaces were set up in 1.3) exist.

2. **And** at least **one minimal spec** runs green locally (e.g. smoke against **`about:blank`** or an equally static placeholder) so **`playwright test`** exits **0** with **no dependency** on the todo app, **API integration**, or **Docker Compose**.

3. **And** **README** (root) documents **`npx playwright install`** (or **`pnpm exec playwright install`** / **`npm exec playwright install`** aligned with the repo package manager) so contributors can fetch browser binaries locally.

4. **And** **CI** includes a job that **installs Playwright browsers** per [Playwright CI docs](https://playwright.dev/docs/ci) (e.g. `npx playwright install --with-deps` on `ubuntu-latest` after `npm ci`) and runs **`test:e2e`** successfully on PR/push.

## Tasks / Subtasks

- [ ] **Scaffold `e2e/`** (AC: #1, #2)
  - [ ] Add `e2e/package.json` with `@playwright/test` (pin version in lockfile after first install; align with [Source: _bmad-output/project-context.md] E2E = Playwright).
  - [ ] Add `e2e/playwright.config.ts` (TypeScript; reasonable defaults: `testDir: './tests'`, `reporter: 'html'` optional for local debugging; **do not** require `baseURL` to the Vite app for the minimal spec).
  - [ ] Add `e2e/tests/*.spec.ts` with one minimal test (e.g. `await page.goto('about:blank'); await expect(page).toHaveURL('about:blank');` or navigate to `data:text/html,<html>...</html>` if you prefer—must be hermetic and fast).
  - [ ] Wire **`test:e2e`** at root (and/or in `e2e/`) so from repo root one command runs the suite (e.g. `npm run test:e2e -w e2e` or `cd e2e && npm test`—match Story 1.3 workspace conventions).

- [ ] **Documentation** (AC: #3)
  - [ ] In root **README**, add a short **E2E / Playwright** subsection: one-time browser install, how to run `test:e2e`, and pointer that **full user journeys** land in **Epic 3** (this story is harness only).

- [ ] **CI job** (AC: #4)
  - [ ] Add `.github/workflows/ci.yml` (or extend if 1.1–1.3 already added a workflow) with a **dedicated job** (or step matrix) that: checks out repo, sets up **Node ≥ 20**, installs dependencies (root workspaces if used), runs **`npx playwright install --with-deps`** (or pnpm equivalent), then **`npm run test:e2e`** (or documented equivalent).
  - [ ] Ensure the job does **not** assume **Docker**, **Compose**, or **API integration tests** (those are **Epic 2 / 4** per [Source: _bmad-output/planning-artifacts/epics.md#Epic-1]).

- [ ] **Hygiene** (AC: #1–#4)
  - [ ] Confirm **`.gitignore`** from Story 1.2 already excludes Playwright artifacts (`playwright-report/`, `test-results/`, etc.); add any missing entries if the scaffold creates new cache paths.

## Dev Notes

### Scope boundaries (non-negotiable)

- **In scope:** Playwright package, config, **one minimal** passing spec, **`test:e2e`**, README browser-install note, **green CI** for that command.
- **Out of scope for this story:** E2E against **running client + API**, **todo journeys**, **OpenAPI**, **integration tests under `api/test/integration/`**, **Docker / Compose** for E2E. Epic 3 extends the harness; Epic 2 owns API integration tests [Source: _bmad-output/planning-artifacts/epics.md — Epic 1 “Out of scope” and Story 1.4].

### Architecture compliance

- **Layout:** Root **`e2e/`** with **`playwright.config.ts`** and **`tests/`** matches [Source: _bmad-output/planning-artifacts/architecture.md — Project Structure & Boundaries].
- **Future:** Architecture lists fuller specs (`todo-happy-path.spec.ts`, etc.)—**do not implement those now**; only the minimal scaffold.
- **CI target:** Architecture expects `.github/workflows/ci.yml` to eventually include lint, typecheck, unit, integration, build, Playwright [Source: architecture.md]. This story **must** add or extend so **Playwright runs green**; if no workflow exists yet, this job can be the first workflow file or sit beside jobs from 1.1–1.3.

### Technical requirements

- **Node:** **≥ 20** everywhere (local + CI) [Source: project-context.md, epics.md].
- **Package manager:** Match whatever Stories 1.1–1.3 established (`npm`, `pnpm`, or `yarn`); Playwright install commands in README/CI must match.
- **Playwright CI:** On GitHub Actions + Ubuntu, typical pattern is `npx playwright install --with-deps` after dependency install; use official Playwright doc for any flag changes in current `@playwright/test` version.
- **Workspaces:** If root `package.json` uses `workspaces`, add `"e2e"` to the workspace list and ensure hoisting does not break `playwright` CLI resolution (run from `e2e/` or via `-w e2e`).

### Library / framework requirements

- **`@playwright/test`:** Only official Playwright test runner for this repo; no Cypress unless product changes.
- **TypeScript:** Prefer `playwright.config.ts` and `.spec.ts` tests consistent with client/api TS usage.

### File structure requirements

```text
e2e/
├── package.json
├── playwright.config.ts
└── tests/
    └── (e.g.) smoke.spec.ts
```

Root: `package.json` script `test:e2e`; optional `.github/workflows/ci.yml` job `e2e` or `playwright`.

### Testing requirements

- **This story:** One spec, deterministic, **no network** to real servers unless explicitly justified (prefer `about:blank` / data URL).
- **Coverage / unit:** No change required to Vitest coverage for this story unless CI already enforces global thresholds—keep E2E job independent of client/api unit suites failing for unrelated reasons if your pipeline design allows parallel jobs with separate `needs:` (optional optimization).

### Project structure notes

- **`codebase_status`** in project-context was **planning_only** at generation time; implementing dev may create `client/`/`api/` for the first time in 1.1–1.3. **Story 1.4 assumes those directories exist** per acceptance criteria—if running out of order, complete 1.1–1.3 first or verify the repo state.

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Story 1.4, Epic 1 goal & Playwright bullet]
- [Source: _bmad-output/planning-artifacts/architecture.md — Testing, CI, `e2e/` tree, boundaries]
- [Source: _bmad-output/project-context.md — Technology stack, Testing Rules, Development Workflow Rules]
- Playwright CI: https://playwright.dev/docs/ci

## Previous story intelligence

- No prior story files exist yet under `_bmad-output/implementation-artifacts/` for Epic 1. **Coordinate with Stories 1.1–1.3:** workspace layout, root scripts, and `.gitignore` must be compatible; avoid duplicate or conflicting `test:e2e` definitions.

## Latest technical notes (Playwright + GitHub Actions)

- Prefer **`ubuntu-latest`** for the Playwright job; use **`--with-deps`** on Linux CI so system dependencies for Chromium are installed.
- Pin **`@playwright/test`** in `package.json` and commit lockfile; after upgrades, re-run `playwright install` locally to refresh browser cache expectations.
- Upload **`playwright-report/`** as a workflow artifact on failure (optional enhancement, not required by epics for this story).

## Project context reference

- Agents must follow `_bmad-output/project-context.md` for stack conventions; for this story, the critical bits are **root `e2e/`**, **Playwright** for E2E, and **CI bar** including Playwright once pipelines exist.

## Story completion status

- **Status:** ready-for-dev  
- **Note:** Ultimate context engine analysis completed — comprehensive developer guide created for Story 1.4.

## Dev Agent Record

### Agent Model Used

_(filled by dev agent)_

### Debug Log References

### Completion Notes List

### File List

_(filled by dev agent)_

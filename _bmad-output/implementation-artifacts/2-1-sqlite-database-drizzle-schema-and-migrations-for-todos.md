# Story 2.1: SQLite database, Drizzle schema, and migrations for `todos`

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **developer**,
I want **`todos` persisted in SQLite** via **Drizzle** with **versioned migrations**,
so that **todo data survives process restarts** per **NFR-R1** and matches the Architecture data model.

## Acceptance Criteria

1. **Given** the **`api/`** service **when** migrations are applied (documented **`drizzle-kit`** workflow—e.g. `generate` + apply migrate, or explicitly documented **`push`** only for local throwaway DBs) against **`DATABASE_PATH`** from **`api/.env.example`** **then** a **`todos`** table exists in SQLite with **snake_case** columns: **`id`**, **`text`**, **`completed`**, **`created_at`**, **`updated_at`** (physical names per Architecture).
2. **`updated_at`** is **set on row creation** (same instant as **`created_at`** via SQL default and/or migration semantics); later stories (**2.2–2.3**) will refresh **`updated_at`** on every mutating change—this story only establishes the column and create-time behavior.
3. The table is **shaped for NFR-SC1**: adding a future nullable **`user_id`** (or tenant key) column **does not** require redesigning core todo semantics (e.g. no composite PK that blocks a per-user index strategy; document intended extension point in **`db/`** or migration comment).
4. **Out of scope:** **`GET /health`**, **`GET /ready`**, and any **HTTP** todo routes—those are **Epic 4** (health/ready) and **Stories 2.2+** (REST). Do **not** implement liveness/readiness in this story.

## Tasks / Subtasks

- [ ] **Dependencies** (AC: 1–3)
  - [ ] Add **`drizzle-orm`**, **`better-sqlite3`** to **`api/`** runtime dependencies; add **`drizzle-kit`** as devDependency (versions pinned in **`package-lock.json`** after install).
  - [ ] Reconcile **`better-sqlite3`** native build with **Node ≥ 20** and CI (document if extra CI steps are needed; Epic 2.4 may extend CI—this story should at least keep **`npm test`** / **`lint`** green).
- [ ] **Config** (AC: 1)
  - [ ] Add **`drizzle.config.*`** at **`api/`** root (Architecture shows **`drizzle.config.ts`**; **`drizzle.config.js`** is acceptable if the API remains JS-only—pick one and align **`drizzle-kit`** CLI).
  - [ ] Point config at **`DATABASE_PATH`** (env or resolved path) and at schema entry (e.g. **`./db/schema.js`**).
- [ ] **Schema module** (AC: 1–3)
  - [ ] Create **`api/db/`** with **`schema`** defining **`todos`** table: map TS/JS field names to **`snake_case`** columns using Drizzle **`columnName`** (or equivalent) where application names are camelCase.
  - [ ] **`id`**: stable primary key (e.g. **integer autoincrement** or **text UUID**—choose one, document briefly; must be stable for REST **`/todos/:id`** in **2.2**).
  - [ ] **`text`**: store todo body; type and length limits for HTTP validation land in **2.2**—schema should allow reasonable storage (e.g. **text** column).
  - [ ] **`completed`**: boolean/integer consistent with Drizzle + SQLite (document mapping).
  - [ ] **`created_at`**, **`updated_at`**: store as SQLite **integer (unix ms)** or **text (ISO)**—**must** serialize to **ISO 8601 UTC strings in JSON** at the API boundary in **2.2**; pick one storage representation and document it for the next story.
- [ ] **Migrations** (AC: 1)
  - [ ] Add **`api/migrations/`** (or Drizzle default) with **versioned SQL** from **`drizzle-kit generate`** (preferred for reproducible deploys per Architecture).
  - [ ] Document in **`api/README.md`** (short): how to create DB file parent dir if needed, run migrate against **`DATABASE_PATH`**, and when **`drizzle-kit push`** is **not** acceptable (production / CI reproducibility).
- [ ] **DB bootstrap helper (optional but recommended)** (AC: 1)
  - [ ] Small **`api/db/index.js`** (or equivalent) that opens **`better-sqlite3`** using **`DATABASE_PATH`**, runs **`migrate`** (Drizzle migrator) once at startup **or** exposes a **`npm run db:migrate`** script—choose one pattern and document so **2.2** can import a single connection/migrate path.

## Dev Notes

### Epic 2 cross-story context

- **2.1 (this story):** persistence layer only—schema + migrations + wiring to **`DATABASE_PATH`**.
- **2.2:** **`GET`/`POST`** todos, validation, **`fastify.inject`** integration tests—expects migrated DB.
- **2.3:** **`PATCH`/`DELETE`**, **404**, **`updated_at`** refresh on mutations.
- **2.4:** OpenAPI, CORS, CI job for integration tests.

Do **not** block **2.2** on undocumented migration steps; the **default dev path** must be one short sequence (README or **`api/README.md`**).

### Architecture compliance

- **Stack:** SQLite + **`better-sqlite3`** + **Drizzle** + **drizzle-kit** [Source: `_bmad-output/planning-artifacts/architecture.md` — Data Architecture, Project Structure].
- **Naming:** Table **`todos`**; columns **`snake_case`** in DB; JSON remains **camelCase** at HTTP layer in later stories [Source: architecture — Naming Patterns, Format Patterns].
- **Layout:** **`api/db/`**, **`api/migrations/`**, **`drizzle.config.*`** at **`api/`** root [Source: architecture — Project Structure tree].
- **Env:** **`DATABASE_PATH`** already exemplified in **`api/.env.example`** (`./data/todos.db`)—ensure **`data/`** (or chosen path) is **gitignored** (Epic 1 **`.gitignore`** should already cover `*.db` / paths; verify).

### File structure requirements

| Area | Path |
|------|------|
| Schema | `api/db/schema.js` (or `.ts` if TS introduced for Drizzle only) |
| DB client / migrate entry | `api/db/index.js` (recommended) |
| Migrations SQL | `api/migrations/` (Drizzle output) |
| Kit config | `api/drizzle.config.js` or `api/drizzle.config.ts` |
| Docs | `api/README.md` — migrate commands |

Match **Fastify** scaffold conventions: **kebab-case** route/plugin files elsewhere; **`db/`** is new—keep **one** clear module boundary.

### Technical requirements (guardrails)

- **No HTTP todo endpoints** in this story.
- **No `/health` or `/ready`** (Epic 4).
- Prefer **versioned SQL migrations** over **only** `push` for anything that represents “real” environments; if `push` is documented, label it **local-only**.
- **`updated_at` on create:** use SQL **`DEFAULT`** or explicit migration so new rows get both timestamps without requiring application code in **2.1** (mutations will update **`updated_at`** in **2.2/2.3**).

### Testing requirements

- **This story:** No **`api/test/integration/`** todo CRUD yet (**2.2**). Optional: **unit** or **small script** that runs migrator against a **temp file** and asserts table/columns exist—nice-to-have, not required if migrate is verified manually once and documented.
- **Regression:** Existing **`api`** **`npm test`** and **`npm run lint`** must pass.

### Previous story intelligence (Epic 1 closure)

- **1.5** documents bootstrap, **`DATABASE_PATH`** in **`.env.example`**, and defers integration tests to Epic 2 [Source: `_bmad-output/implementation-artifacts/1-5-readme-and-fresh-clone-bootstrap.md`].
- **`api/package.json`** today has **no** Drizzle/SQLite deps—this story is the **first** native addon (**`better-sqlite3`**); expect **local `npm install`** to compile native code.

### Latest technical notes (Drizzle + better-sqlite3)

- Use **`drizzle-orm/better-sqlite3`** driver with **`drizzle-kit`** **`dialect: 'sqlite'`**.
- **`drizzle-kit generate`** emits SQL files; apply with Drizzle’s **`migrate()`** API against **`better-sqlite3`** connection—align versions from npm **`drizzle-orm`** / **`drizzle-kit`** release pairing at install time.
- If the repo stays **JS** for Fastify, **`drizzle.config.ts`** may require **`tsx`** or switching config to **`.js`**—prefer the path of least friction for **`npx drizzle-kit`** invocations.

### Project context reference

- Follow **`_bmad-output/project-context.md`**: SQLite + Drizzle + **`DATABASE_PATH`**; **snake_case** DB, **camelCase** JSON (for later API work); table **`todos`**; **`updatedAt`** discipline on mutations applies from **2.2** onward.

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

---

**Story completion status:** Ultimate context engine analysis completed — comprehensive developer guide created.

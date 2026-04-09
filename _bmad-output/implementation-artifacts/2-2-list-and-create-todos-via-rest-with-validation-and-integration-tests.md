# Story 2.2: List and create todos via REST with validation and integration tests

Status: ready-for-dev

<!-- Ultimate context engine analysis completed - comprehensive developer guide created -->

## Story

As a **client application** (Sam),
I want **`GET` (list)** and **`POST` (create)** todos with **consistent JSON** and **clear validation errors**,
so that **the UI can load and add tasks reliably** (**FR17–FR19**, **FR22**).

## Blockers and order

- **Complete Story 2.1 first** (or land its outputs in the same branch before calling this done): `todos` table, Drizzle schema, migrations, and a working `DATABASE_PATH` workflow. This story assumes **migrated SQLite** and **Drizzle access patterns** from 2.1 exist.
- There is **no** prior implementation-artifact file for **2-1** in the repo yet; use **`_bmad-output/planning-artifacts/epics.md`** (Story 2.1 AC) as the contract for what the DB layer must provide.

## Acceptance Criteria

1. **Given** a running API with database migrated per Story 2.1  
   **When** the client **`GET`s** the list endpoint using the **single locked path prefix** (**`/todos`** *or* **`/api/todos`** — choose **one** in this story, document it in code comments and any interim README note; OpenAPI formalization is Story 2.4)  
   **Then** the response is **JSON** with **camelCase** todo fields and **`createdAt` / `updatedAt`** as **ISO 8601 UTC** strings  
   **And** the list is wrapped in a **keyed** envelope (**`{ "todos": [...] }`**) for forward compatibility, unless you explicitly document and test a different contract (architecture prefers keyed object) [Source: `_bmad-output/project-context.md`, `architecture.md`]

2. **Given** a valid **create** payload (non-empty todo **text** within documented bounds)  
   **When** the client **`POST`s** to the same prefix (e.g. **`POST /todos`** or **`POST /api/todos`**)  
   **Then** the todo is **persisted** in SQLite and the response returns the **full** todo entity including stable **`id`**, **`text`**, **`completed`** (boolean), **`createdAt`**, **`updatedAt`**  
   **And** **`updatedAt`** is set on create (same instant as **`createdAt`** is acceptable for the first version) per NFR on mutating fields [Source: `_bmad-output/project-context.md` — Critical Don't-Miss Rules]

3. **Given** an **invalid** body (e.g. **missing `text`**, **empty `text`**, **text over max length**, or pathological payload)  
   **When** the client **`POST`s**  
   **Then** the API responds **400** with the **standard error envelope**: `{ "error": { "code", "message", "details?" } }`  
   **And** the response does **not** leak stack traces or internal messages suitable for attack planning (**NFR-S3**) [Source: `epics.md` Additional Requirements, `architecture.md`]

4. **Given** integration test setup  
   **When** tests run (e.g. **`npm test`** in **`api/`** extended to include integration, or a dedicated script if you split runners)  
   **Then** **`api/test/integration/`** contains tests using **real HTTP** via **`fastify.inject`** (or equivalent) against an **isolated test SQLite file** (or documented ephemeral DB), with **migrations/schema applied** the same way as production/docs  
   **And** coverage includes: **happy list** (empty and/or with rows), **happy create**, **validation failure → 400** with error envelope [Source: `epics.md` Story 2.2, `architecture.md` — API integration tests]

5. **Given** server-side failures or validation rejections  
   **Then** **FR25** is respected: **Pino** (or the scaffold’s structured logger) records useful context (**`reqId`**, route, relevant ids where applicable) to **stdout/stderr** without echoing abusive payloads at **info** level [Source: `epics.md`, `project-context.md`]

## Tasks / Subtasks

- [ ] **Lock REST prefix and route module** (AC: #1–3)  
  - [ ] Add **`api/routes/todos.js`** (or **`todos/index.js`** if using nested route folders) matching **existing autoload** layout under `api/routes/` [Source: `api/app.js`, `architecture.md` — Structure Patterns]  
  - [ ] Register **GET** (list) and **POST** (create) only; defer **PATCH**/**DELETE** to Story 2.3  
  - [ ] Document chosen prefix in a short comment at top of the route file

- [ ] **Wire persistence** (AC: #1–2)  
  - [ ] Reuse **Drizzle + `todos` table** from Story 2.1 (`api/db/` per architecture); map **snake_case** columns ↔ **camelCase** JSON  
  - [ ] **GET**: return all todos ordered deterministically (e.g. **`created_at` ASC**); document choice  
  - [ ] **POST**: insert row, set **`completed`** default **false**, set **`created_at` / `updated_at`** per schema

- [ ] **HTTP boundary validation** (AC: #3)  
  - [ ] Use **Fastify JSON Schema** on the **POST** body (architecture: JSON Schema at boundary)  
  - [ ] Define a **reasonable `maxLength`** for **`text`** (PRD: NFR-S1 — pick a concrete number, e.g. 1–10k chars, and keep DB column compatible)  
  - [ ] Map validation failures to **400** + **`error.code`** (e.g. **`VALIDATION_ERROR`**) + human-readable **`message`**; optional **`details`** for field-level hints

- [ ] **Integration tests** (AC: #4)  
  - [ ] Create **`api/test/integration/`** if missing  
  - [ ] Add a **test app builder** pattern: build Fastify app with **`DATABASE_PATH`** pointing at a **temp file**, run **migrations** (or documented schema apply) before tests, **unlink/close** after suite if needed  
  - [ ] Tests: **GET** empty list → `{ todos: [] }`; **POST** valid → **201** or **200** (pick one, stay consistent with later OpenAPI); **GET** returns new row; **POST** invalid → **400** + envelope  
  - [ ] Use **`fastify.inject`**; assert **status**, **JSON shape**, and **persistence** across sequential calls within a test

- [ ] **Logging** (AC: #5)  
  - [ ] Ensure validation and unexpected paths log appropriately; avoid logging full abusive bodies at info

- [ ] **Scripts**  
  - [ ] Extend **`api/package.json`** so **`npm test`** runs **unit** tests **and** **`api/test/integration/*`** (or add **`test:integration`** and document running both locally). Story **2.4** adds the **dedicated CI job** for API integration tests; until then, local + doc is acceptable per epic split.

## Dev Notes

### Technical requirements

- **Stack:** Fastify 5, `@fastify/autoload`, Node **≥ 20** — see `api/package.json`. No OpenAPI/CORS CI gate in this story (Story **2.4**).  
- **JSON:** **camelCase** only in API bodies/responses; dates **ISO 8601 UTC**.  
- **Errors:** Single envelope `{ error: { code, message, details? } }` for **all** non-2xx JSON errors in this story’s routes.  
- **Statuses:** **400** validation; reserve **404** for Story 2.3; **500** only for unexpected server errors with generic client message.

### Architecture compliance

- Single prefix **`/todos`** or **`/api/todos`** — **never** both.  
- Table **`todos`**, physical columns **snake_case**; Drizzle **`columnName`** mapping as in `architecture.md` / `project-context.md`.  
- Integration tests live under **`api/test/integration/`** with **isolated DB** per run or suite.  
- Reuse existing **`api/test/helper.js`** (`buildApplication` from `fastify-cli/helper`) where possible; you may need to pass **opts** (e.g. env or plugin options) so **`DATABASE_PATH`** is test-specific.

### Library and dependencies

- Story 2.1 should add **`better-sqlite3`**, **`drizzle-orm`**, **`drizzle-kit`**; this story may add **`@fastify/swagger`** only if you need it early — **optional**; contract hardening is **2.4**.  
- Prefer **Fastify JSON Schema** for request validation; shared **Zod** is optional per architecture.

### File structure (expected touches)

| Area | Path |
|------|------|
| Routes | `api/routes/todos.js` (or `api/routes/todos/index.js`) |
| DB access | `api/db/*` (from 2.1 — extend with list/insert helpers if useful) |
| Integration tests | `api/test/integration/todos-list-create.test.js` (name as you prefer) |
| Test helper | Extend `api/test/helper.js` or add `api/test/integration/setup.js` for DB + build |

### Testing requirements

- **Minimum:** three scenarios — list (happy), create (happy), create (validation error).  
- Prefer **Node’s built-in test runner** (`node --test`) to match current `api/package.json` **`test`** script unless the team standardizes on Vitest for `api/` in an earlier change.  
- Assertions: HTTP status, parsed JSON, and **second request** sees persisted data after create.

### Previous story intelligence

- **Story 2.1** file not present under `implementation-artifacts/`; treat **`epics.md` § Story 2.1** as source of truth for schema (`id`, `text`, `completed`, `created_at`, `updated_at`, future **`user_id`** compatibility).  
- **Epic 1** left **`api/`** as create-fastify scaffold: `app.js`, `routes/root.js`, `routes/example/`, `plugins/*`, `test/helper.js` — match **kebab-case / autoload** naming already in use.

### Latest technical notes

- **`fastify.inject`** is the recommended way to exercise routes without a live port (Fastify 5 docs).  
- Ensure **better-sqlite3** native binding works in CI when Story 2.4 wires API tests into GitHub Actions (ubuntu-latest + `npm ci`).

### Project context reference

- Read **`_bmad-output/project-context.md`** before coding; it restates **camelCase JSON**, **error envelope**, **GET `{ todos: [] }`**, **`updatedAt` on mutations**, and **anti-patterns** (mixed prefixes, snake_case JSON).

## Dev Agent Record

### Agent Model Used

_(filled by dev agent)_

### Debug Log References

### Completion Notes List

### File List

---

**Completion note:** Ultimate context engine analysis completed — comprehensive developer guide created.

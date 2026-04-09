# Story 2.3: Update completion and delete todos with 404 semantics and integration tests

Status: ready-for-dev

<!-- Ultimate context engine analysis completed — comprehensive developer guide created. -->

## Story

As a **client application**,
I want **`PATCH` (or `PUT`)** to toggle completion and **`DELETE`** by id with **404** when missing,
so that **users can complete, uncomplete, and remove todos** (**FR20**, **FR21**, **FR23**) with predictable outcomes.

## Acceptance Criteria

1. **Given** at least one todo exists in the database **when** the client toggles **`completed`** via the documented update endpoint **then** the stored row updates, **`updatedAt`** changes, and the response returns the **full todo** entity (camelCase JSON, ISO 8601 UTC timestamps).
2. **Given** an existing todo **when** the client **`DELETE`s** that id **then** the todo is removed and the response follows the **single chosen convention** for successful delete (**`204 No Content`** *or* **`200`** with a documented body — **pick one in this story** and use it consistently; Story 2.4 will publish it in OpenAPI).
3. **Given** a non-existent id **when** the client **`PATCH`es** or **`DELETE`s** **then** the API returns **`404`** with the standard error envelope `{ "error": { "code", "message", "details?" } }`.
4. **Integration tests** under **`api/test/integration/`** cover: happy-path **toggle** (including **`updatedAt`** change), happy-path **delete**, **404** on PATCH and DELETE for missing ids, and **persistence** (e.g. after delete, GET list no longer contains the row; after PATCH, subsequent GET reflects `completed`).
5. **NFR-S1:** PATCH/DELETE handling stays consistent with bounded input from Story 2.2 (payload limits, reject pathological bodies); invalid update body yields **`400`** with the same error envelope, not **`500`**.

## Tasks / Subtasks

- [ ] **Prerequisites (blockers)** (AC: all)
  - [ ] Confirm Story **2.1** (Drizzle schema + migrations + `todos` table) and **2.2** (`GET` list + `POST` create, prefix locked, integration harness) are done — this story **extends** those routes; do not invent a second prefix or error shape.
- [ ] **PATCH completion** (AC: #1, #3, #5)
  - [ ] Implement **`PATCH /{prefix}/:id`** (prefix is whatever 2.2 locked: `/todos` or `/api/todos`) with JSON body accepting at least `{ "completed": boolean }`; validate with Fastify JSON Schema (or agreed boundary validator).
  - [ ] On success: update `completed` and **`updated_at`** in SQLite; return **full** todo DTO (`id`, `text`, `completed`, `createdAt`, `updatedAt`).
  - [ ] On unknown id: **`404`** + standard error envelope (stable `code` string, safe `message`).
  - [ ] On invalid body: **`400`** + envelope.
- [ ] **DELETE todo** (AC: #2, #3)
  - [ ] Implement **`DELETE /{prefix}/:id`**; remove row when present.
  - [ ] Apply **one** success response style project-wide: prefer **`204 No Content`** with **empty body** *or* **`200`** with a small JSON body — **must match** Architecture “do not mix” rule and whatever you document for 2.4.
  - [ ] Unknown id: **`404`** + same envelope as PATCH.
- [ ] **Integration tests** (AC: #4)
  - [ ] Add/extend **`api/test/integration/`** using **`fastify.inject`** (or equivalent) against a **real** app build with **isolated test SQLite** per run (same pattern as 2.2).
  - [ ] Tests: create todo via **POST** → **PATCH** toggle → assert JSON + **`updatedAt`** strictly after previous; **PATCH** missing id → 404; **DELETE** existing → success convention; **DELETE** missing → 404; list or get semantics prove row gone after delete.
- [ ] **Logging / observability** (AC: implied FR25, NFR-S3)
  - [ ] Log mutation outcomes at appropriate level; include **todo id** when relevant; do not return stack traces or internal details in JSON errors.

## Dev Notes

### Prerequisites and ordering

- **Do not start** this story until **2.1** and **2.2** are implemented. The repo may still be **scaffold-only** under `api/routes/` (root + example). This story **adds** behavior on top of the list/create implementation from 2.2.
- Reuse the **same** Fastify autoload layout (`api/routes/`, `api/plugins/`), **same** DB access layer, **same** DTO mapping (snake_case columns → camelCase JSON), and **same** error-helper patterns introduced in 2.2.

### Architecture compliance

- **REST prefix:** Only the path chosen in 2.2 — never mix `/todos` and `/api/todos`. Param name **`:id`** consistent with OpenAPI later.
- **Errors:** All non-2xx JSON responses use `{ "error": { "code", "message", "details?" } }`. **400** = validation; **404** = missing todo; **500** = unexpected (generic client message).
- **`updatedAt`:** Mandatory on **PATCH** (toggle counts as mutation). **DELETE** removes the row — no `updatedAt` on delete.
- **Dates:** ISO 8601 UTC strings in responses.
- **Table/columns:** `todos` with snake_case physical columns; Drizzle `columnName` mapping as in Architecture.

### Technical requirements (guardrails)

- **Id format:** Use whatever identifier strategy Story 2.2 chose (e.g. integer, UUID string). **PATCH/DELETE** must treat “not found” the same whether id is well-formed but missing vs invalid format — prefer **404** for unknown resource; use **400** only if the id cannot be parsed per your documented contract (be consistent with 2.2).
- **PATCH semantics:** Support **both** complete and uncomplete (`completed: true` and `completed: false`) to satisfy **FR20** and **FR5** at the API layer (UI uses this in Epic 3).
- **DELETE idempotency:** Optional for v1; document behavior if client repeats DELETE (typically second call **404** — acceptable; alternatively 204 if you adopt idempotent DELETE — **stay consistent** with tests and docs).
- **Transaction / concurrency:** Low contention per NFR-R2; simple read-then-update/delete is acceptable unless 2.2 introduced a stricter pattern.

### File structure (expected touchpoints)

- `api/routes/**` — todo route module(s) from 2.2 (extend with `PATCH` and `DELETE`).
- `api/plugins/**` — only if shared decorators (db, error mapper) need extension.
- `api/test/integration/**` — new or extended specs (create folder if 2.2 has not yet).
- Avoid new packages unless already planned in 2.2.

### Testing requirements

- **Runner:** Align with `api/package.json` scripts from 2.2 (e.g. `npm run test:integration` if added there).
- **Isolation:** Each test run uses a dedicated DB file or ephemeral DB; no reliance on developer’s local `DATABASE_PATH`.
- **Assertions:** HTTP status, parsed JSON body (or empty body for 204), and **cross-request** persistence (inject: POST → PATCH → GET, or POST → DELETE → GET).

### Library / framework

- **Fastify 5**, **@fastify/autoload**, **Drizzle**, **better-sqlite3** per `_bmad-output/project-context.md` and `architecture.md`. Do not introduce alternate ORMs or routers.

### Previous story intelligence

- No prior **`2-2-*.md`** story file exists in `_bmad-output/implementation-artifacts/` yet; treat **epics.md** Story 2.2 acceptance criteria and **architecture.md** “Format Patterns” as the source of truth for list/create behavior and test layout.

### Project context reference

- Read **`_bmad-output/project-context.md`** before coding — especially **camelCase JSON**, **error envelope**, **`updatedAt` on mutations**, **DELETE convention (single choice)**, and **status code** rules.

### UX note (scope boundary)

- **Epic 3** consumes these endpoints for toggle/delete UI. This story is **API + integration tests only**; no client changes required unless you need a manual smoke (optional).

## Dev Agent Record

### Agent Model Used

_(filled by dev agent)_

### Debug Log References

### Completion Notes List

### File List

_(filled by dev agent)_

---

## References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 2, Story 2.3]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — API & Communication Patterns, Format Patterns, Implementation Patterns]
- [Source: `_bmad-output/planning-artifacts/prd.md` — FR20, FR21, FR22, FR23, NFR-S1, NFR-S3, FR25]
- [Source: `_bmad-output/project-context.md` — Critical Implementation Rules, Critical Don't-Miss Rules]
- [Source: `api/test/helper.js` — `fastify-cli/helper` `build` pattern for tests]
- [Source: `api/app.js` — autoload of `routes/` and `plugins/`]

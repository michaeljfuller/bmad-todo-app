# Story 3.5: Todo rows — complete, uncomplete, delete, metadata, and styling

Status: ready-for-dev

<!-- Ultimate context engine analysis completed — comprehensive developer guide created. -->

## Story

As a **user** (Alex),
I want **obvious done vs active** tasks and **clear delete**,
so that **I can manage my list at a glance** (**FR4–FR8**, **FR7**, **UX-DR3**, **UX-DR9**, **UX-DR10**).

## Acceptance Criteria

1. **Given** todos in the list **when** the user toggles **complete** **then** the **checkbox** is **labeled** with the todo text (e.g. explicit `<label>` wrapping or **`aria-labelledby`** linking control to text) per **UX-DR6** / **NFR-A2**.
2. **Given** a completed todo **when** it is displayed **then** **completed** styling uses **strikethrough + muted readable** semantic token — **not** the same styling as **disabled** controls (**UX-DR9**, **FR8**).
3. **Given** any todo row **then** **`createdAt`** and **`updatedAt`** from the API render as **small secondary** metadata (e.g. under the primary text), **formatted for local display** while the API remains **ISO 8601 UTC** strings (**UX-DR10**, **FR7**).
4. **Given** a todo row **when** the user activates **Delete** **then** the control is **ghost/outline** with a visible **`focus-visible`** ring (**UX-DR4**) and has an **accessible name** (e.g. `aria-label` including todo context or associated text) (**UX-DR6**).
5. **Mutations:** Toggling completion calls **`PATCH /todos/:id`** with **`{ "completed": boolean }`**; delete calls **`DELETE /todos/:id`**. On success, the list reflects **server truth** (invalidate/update **`['todos']`** cache per Architecture). **DELETE** success is **`204 No Content`** (empty body) — do not expect JSON on success ([Source: `api/test/integration/openapi-contract.test.js`](../../api/test/integration/openapi-contract.test.js)).
6. **Errors:** Failed toggle/delete surfaces **inline or banner** feedback with plain language via the same **`mapApiError`** (or equivalent) path as other mutations — **no raw JSON/stack** in UI (**FR12**, **NFR-S3**, **UX-DR5**).
7. **Pending UX:** While a row-level mutation is in flight, the affected control(s) show **disabled** state (**opacity + `cursor-not-allowed`**) consistent with **UX-DR4** / **NFR-P1** — without conflating “pending” with “completed” visual semantics.
8. **Component tests** cover **`TodoItem`** (or equivalent row component): completed vs active presentation, metadata present, and basic interaction wiring (mocked fetch / Query client).
9. **E2E** extends Playwright with journeys: **mark complete**, **mark active again** (uncomplete), **delete** — against the same orchestration as other Epic 3 specs (local dev servers or documented CI approach).

## Tasks / Subtasks

- [ ] **Prerequisites** (AC: all)
  - [ ] Confirm **Epic 2** API is available: **`GET/POST/PATCH/DELETE`** under **`/todos`**; **`PATCH`** returns **full todo** JSON; **`DELETE`** returns **204** ([Source: `api/routes/todos/index.js`](../../api/routes/todos/index.js)).
  - [ ] Implement or integrate with **Stories 3.1–3.4** deliverables: **Tailwind tokens**, **QueryClient + list query**, **`TodoApp` / `TodoList` / `AddTodoForm`**, and **mutation patterns** for create. **Do not** duplicate global list loading — extend the existing list to render rows with row-level mutations.
- [ ] **`TodoItem` row UI** (AC: #1–#4, #7)
  - [ ] Checkbox + text + metadata stack; **Space** toggles checkbox when focused (**UX-DR6** — full keyboard polish may overlap **3.6**; minimum here is labeled control and toggle works).
  - [ ] **Delete** button: ghost/outline, focus ring, accessible name.
  - [ ] Wire **`useMutation`** (TanStack Query v5) for **PATCH** and **DELETE** with **`mutationKey`** / invalidation aligned to **`['todos']`** ([Source: `_bmad-output/project-context.md`](../project-context.md)).
- [ ] **Server alignment** (AC: #5, #6)
  - [ ] After successful **PATCH**, merge response or refetch so **`updatedAt`** / **`completed`** match server (**FR26**).
  - [ ] Handle **404** / **400** with mapped user-facing messages; retry policy consistent with project rules (no blind **POST** retry; list refetch retry may already exist from **3.2**).
- [ ] **Tests** (AC: #8, #9)
  - [ ] Vitest + Testing Library: row states and mutation-disabled behavior with mocked API.
  - [ ] Playwright: three journeys as specified; align with `e2e/` config from Epic 1.

## Dev Notes

### Dependency ordering (critical)

- **`_bmad-output/implementation-artifacts/`** may have **no** story files for **3-1–3-4** yet, and **`client/`** may still be the **Vite scaffold** without todo UI. This story **assumes** the shell from **3.3** (`TodoApp` → scrollable **`TodoList`** → **`AddTodoForm`**) and **TanStack Query** from **3.2** exist. If those are missing, **complete or stub** the minimal parent structure so **`TodoItem`** can be integrated without inventing a second state layer ([Source: `_bmad-output/planning-artifacts/epics.md`](../planning-artifacts/epics.md) — Stories 3.2–3.4).

### API contract (do not guess)

| Action | Method | Success | Error notes |
|--------|--------|---------|-------------|
| Toggle completion | `PATCH /todos/:id` | **200** + full todo JSON | **404** missing; **400** invalid body |
| Delete | `DELETE /todos/:id` | **204** empty body | **404** missing |

- Id is **positive integer** string; invalid id shape → **404** (same as missing) per API behavior ([Source: `api/routes/todos/index.js`](../../api/routes/todos/index.js) `parseTodoId`).

### Architecture compliance

- **Single Query canonical list** — after mutations, invalidate or update query data; **no** parallel canonical todo list in global React state ([Source: `_bmad-output/planning-artifacts/architecture.md`](../planning-artifacts/architecture.md) § Frontend Architecture).
- **camelCase** JSON fields: `id`, `text`, `completed`, `createdAt`, `updatedAt`.

### File structure (expected)

- `client/src/**` — `TodoItem.tsx` (or agreed name), hooks or API module reusing existing todo client from **3.2**.
- Co-located **`*.test.tsx`** per client convention.
- `e2e/**` — new or extended specs.

### Testing requirements

- Follow **`_bmad-output/project-context.md`** (`../project-context.md`): co-located Vitest tests; Playwright in **`e2e/`**.
- When stubbing **DELETE**, assert **204** with **no** JSON parse.

### Previous story intelligence

- **Story 2.3** (done) defines **PATCH/DELETE** semantics and **204** delete convention — client must treat **204** as success with no body ([Source: `_bmad-output/implementation-artifacts/2-3-update-completion-and-delete-todos-with-404-semantics-and-integration-tests.md`](./2-3-update-completion-and-delete-todos-with-404-semantics-and-integration-tests.md)).
- No **3-4** implementation artifact in repo; mirror patterns from epics **3.4** (double-submit on **Add**) for **per-row** pending/disabled on **PATCH**/**DELETE**.

### Project context reference

- TanStack Query only for server todos; stable **`['todos']`** key; **`mapApiError`** for user-facing errors ([Source: `_bmad-output/project-context.md`](../project-context.md)).

### UX reference

- **UX-DR9** completed vs disabled distinction; **UX-DR10** metadata sizing; **UX-DR4** button hierarchy for Delete vs primary actions ([Source: `_bmad-output/planning-artifacts/epics.md`](../planning-artifacts/epics.md) § UX Design Requirements).

## Dev Agent Record

### Agent Model Used

_(filled by dev agent)_

### Debug Log References

### Completion Notes List

### File List

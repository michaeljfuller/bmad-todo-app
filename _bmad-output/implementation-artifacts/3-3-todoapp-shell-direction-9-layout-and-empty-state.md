# Story 3.3: TodoApp shell, Direction 9 layout, and empty state

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want **one primary screen** with **list above** and **composer below**,
so that **I can scan tasks and capture new ones with minimal thumb/pointer travel** (**FR1**, **FR3**, **FR9**, **UX-DR2**, **UX-DR8**).

## Acceptance Criteria

1. **Direction 9 shell** — Given the **styled app shell** (Tailwind tokens from Story 3.1), when the app renders the todo experience, **`TodoApp`** is a **flex column** with visual order: **page title** → **scrollable list region** (`flex-1`, `min-h-0` so overflow scrolls inside the middle, not the whole viewport) → **bottom `AddTodoForm`** with a **visible top border** separating the composer from the list (**UX-DR2**, **Direction 9** in `_bmad-output/planning-artifacts/ux-design-directions.html` **#dir-9** — reference only, **UX-DR11**).
2. **Empty data** — When the todo query succeeds with **zero** todos (`todos.length === 0`), the **list region** shows a **short, practical empty state**: headline + **one line** of guidance; tone matches **UX-DR8** (not broken, not marketing-heavy). The **`AddTodoForm` remains visible and usable** (or visibly present if submit is still stubbed until 3.4).
3. **Semantics** — **Heading** for the app/title (**`h1`** or documented equivalent), list area has **appropriate landmarks / list semantics** (`<ul>`/`<li>` when items exist; empty region may use a single **`role="status"`** or paragraph — choose a pattern that screen readers understand as “no items yet,” not an error) (**NFR-A2**, **UX-DR6** baseline).
4. **Component tests** — At least one **Vitest + Testing Library** test proves the **empty layout**: shell order, empty copy present, composer present, list region has **`min-h-0` / flex behavior** indirectly verifiable (e.g. container classes or layout wrapper test id — avoid testing Tailwind class strings as the only signal unless project already does so).
5. **E2E** — Extend **`e2e/tests/`** with a spec for the **empty list** journey: load app against **running API with empty DB** *or* a **documented test double** (same strategy as Story 3.2). Assert **title**, **empty state text**, and **composer** are visible.

## Prerequisites

- **Story 3.1** — Tailwind installed, semantic tokens, dark-first baseline. Without this, “styled shell” and borders/spacing will not match UX specs.
- **Story 3.2** — **`QueryClientProvider`**, `useQuery` for todos with stable **`queryKey`** (e.g. **`['todos']`**), and a way to render **success with an empty array**. This story **composes** that data layer into **`TodoApp`** layout; do **not** duplicate a second canonical fetch path.
- If 3.1/3.2 are not merged yet, implement **3.3 on the same branch after those slices** or treat 3.3 as “layout + empty UI” that plugs into mocked Query in tests until 3.2 lands (prefer **one branch ordering: 3.1 → 3.2 → 3.3**).

## Tasks / Subtasks

- [x] **Structure** (AC: #1, #3)
  - [x] Add **`TodoApp.tsx`** (and wire from **`App.tsx`** or **`main.tsx`** as the single todo surface) per Architecture tree: `client/src/todos/TodoApp.tsx`.
  - [x] Implement **flex column** root: full viewport height (`min-h-screen` or `h-dvh`), inner column **`flex flex-col flex-1 min-h-0`** pattern so the **list panel** scrolls.
  - [x] **`TodoList.tsx`** — renders **children** or **empty state**; middle wrapper gets **`flex-1 min-h-0 overflow-y-auto`** (or equivalent) for scroll containment.
  - [x] **`AddTodoForm.tsx`** — shell at bottom with **`border-t`** using **panel/border tokens** from 3.1; **Story 3.4** adds full submit behavior — for 3.3, include labeled input + primary button **or** clearly disabled placeholder **only if** AC #2 “composer stays visible” is still met (prefer **real visible controls** even if mutation arrives in 3.4).
- [x] **Empty state** (AC: #2)
  - [x] When `isSuccess && todos.length === 0`, render concise **headline + one supporting line** inside the scrollable list region (not below the composer).
  - [x] Do **not** treat empty as **error**; no red banner unless the **query failed** (that path is 3.2).
- [x] **Tests** (AC: #4, #5)
  - [x] **`TodoApp.test.tsx`** (or co-located): empty success path with **mocked `useQuery`** return `{ data: { todos: [] }, isSuccess: true, isPending: false }` (align with actual **API response shape** `{ todos: [...] }` from Epic 2).
  - [x] **Playwright**: `e2e/tests/**` spec — empty DB scenario; document **base URL** / API dependency in spec comment or README if needed.

## Dev Notes

### Technical requirements

- **Server state:** Only **TanStack Query** for the list; empty state reads from **query result**, not a parallel `useState` copy ([Source: `_bmad-output/project-context.md` — Server state / Query keys]).
- **API shape:** **`GET /todos`** returns **`{ todos: Todo[] }`** (keyed object); todos use **camelCase** fields ([Source: `architecture.md` — Success responses]).
- **Visual reference:** **`ux-design-directions.html`** — inspect **#dir-9** for proportions; **do not** import or bundle that HTML in production (**UX-DR11**).

### Architecture compliance

- Component names and locations: **`TodoApp`**, **`TodoList`**, **`AddTodoForm`** under **`client/src/todos/`** ([Source: `architecture.md` — Project Structure / Frontend Architecture]).
- **Single-route SPA** — no router required ([Source: `architecture.md` — Frontend Architecture]).
- **Typography scale** for title: **`text-xl`–`text-2xl`**, semibold; body **`text-base`**; align with **UX-DR12** where applicable.

### Library / framework requirements

- **React 19 + Vite 8 + TypeScript** (`client/`), **TanStack Query v5** (from 3.2), **Tailwind** (from 3.1), **Vitest 4 + Testing Library**, **Playwright** in **`e2e/`** ([Source: `_bmad-output/project-context.md` — Technology Stack]).

### File structure requirements

| Area | Path |
|------|------|
| Shell / layout | `client/src/todos/TodoApp.tsx` |
| List + empty | `client/src/todos/TodoList.tsx` |
| Composer (shell) | `client/src/todos/AddTodoForm.tsx` |
| App entry wiring | `client/src/App.tsx` (replace Vite marketing placeholder when integrating) |
| Query / providers | `client/src/main.tsx` or `App.tsx` — **QueryClientProvider** must wrap **`TodoApp`** (established in 3.2) |
| Component tests | Co-located `*.test.tsx` next to components (match existing `client` convention) |
| E2E | `e2e/tests/*.spec.ts` (see `e2e/playwright.config.ts` **`testDir: './tests'`**) |

### Testing requirements

- **Component:** Focus on **empty success** path; avoid coupling to real network in unit tests — mock **`useQuery`** or MSW if the project standardizes it in 3.2.
- **E2E:** Must pass in **CI** when API is empty: follow the **same orchestration** as Story 3.2 list-load spec (document **`baseURL`**, env, or compose in epic notes).

### Previous story intelligence

- No **`3-1-*`** or **`3-2-*`** implementation-artifact story files exist in-repo yet; treat **`epics.md` Stories 3.1 and 3.2** as the contract for tokens, Query setup, **`QueryErrorBanner`**, and **`mapApiError`**. **3.3** must **reuse** those pieces rather than reimplement loading/error UI (empty state is **success**, not error).

### Project context reference

- Follow **`_bmad-output/project-context.md`** for React/TanStack rules, JSON field naming, and testing placement.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Story 3.3]
- [Source: `_bmad-output/planning-artifacts/epics.md` — UX-DR2, UX-DR8, UX-DR11, UX-DR3, UX-DR12]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — Frontend Architecture, Project Structure, Implementation Patterns]
- [Source: `_bmad-output/planning-artifacts/ux-design-directions.html` — #dir-9 visual reference only]
- [Source: `_bmad-output/project-context.md`]

## Dev Agent Record

### Agent Model Used

Composer (Cursor agent)

### Debug Log References

- E2E `webServer` failed until `TodoApp.test.tsx` mock used `as unknown as` — `tsc -b` includes `*.test.tsx` in `tsconfig.app.json`.

### Completion Notes List

- **AC1–AC3:** `TodoApp` Direction 9 column: `h1` → `TodoList` scroll region (`flex-1 min-h-0 overflow-y-auto`, `data-testid="todo-list-scroll"`) → `AddTodoForm` with `border-t border-fg-primary/15`. Reused `useTodosQuery`, `QueryErrorBanner`, and loading skeletons from 3.2 (moved from removed `TodoListPanel`).
- **AC2:** Empty success: `role="status"` + headline/supporting line inside scroll region; composer always visible with labeled input + Add (submit `preventDefault` until 3.4).
- **AC4:** `TodoApp.test.tsx` mocks `useTodosQuery` with `data: []` (client normalizes `{ todos }` to `Todo[]` in `fetchTodos`); asserts layout `testid`s, DOM order, scroll classes, empty copy, form controls.
- **AC5:** `e2e/tests/todo-app-empty-shell.spec.ts` + comment block for `baseURL` / fresh DB; `todo-list-load.spec.ts` updated for new empty markers.

### File List

- `client/src/App.tsx`
- `client/src/App.test.tsx`
- `client/src/todos/AddTodoForm.tsx`
- `client/src/todos/TodoApp.tsx`
- `client/src/todos/TodoApp.test.tsx`
- `client/src/todos/TodoList.tsx`
- `client/src/todos/TodoList.test.tsx`
- `client/src/todos/TodoListPanel.tsx` (removed)
- `client/src/todos/TodoListPanel.test.tsx` (removed)
- `e2e/tests/todo-app-empty-shell.spec.ts`
- `e2e/tests/todo-list-load.spec.ts`

## Change Log

- 2026-04-10: Story 3.3 — TodoApp shell (Direction 9), empty state, AddTodoForm shell, Vitest + Playwright coverage; replaced `TodoListPanel` with `TodoList` + `TodoApp`.

---

**Story context:** Ultimate context engine analysis completed — comprehensive developer guide created.

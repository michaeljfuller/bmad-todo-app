# Story 3.4: Add todo flow with double-submit protection

Status: review

<!-- Ultimate context engine analysis completed - comprehensive developer guide created -->

## Story

As a **user**,
I want to **add todos quickly** without **duplicate ghosts**,
so that **flaky networks do not corrupt my list** (**FR2**, **FR13**, **NFR-P1**, **UX-DR4**).

## Blockers and order

- **Land Story 3.1** (Tailwind tokens / typography baseline) so **teal primary**, **disabled** styling, and contrast tokens exist for **UX-DR4**.
- **Land Story 3.2** (TanStack Query, list query, `mapApiError`, loading/error/retry) so **`QueryClient`**, **`['todos']` `queryKey`**, and the **API client** calling **`GET /todos`** exist—this story **extends** that stack; do **not** introduce a second server-state pattern.
- **Land Story 3.3** (TodoApp shell, Direction 9, **`AddTodoForm`**) so the **bottom composer** layout, **Enter-to-submit** behavior, and **empty-state** context are in place. If **`AddTodoForm`** is currently a stub, this story **implements** the real **create mutation** wiring inside it (or adjacent hooks) without redesigning the shell.

There is **no** implementation-artifact file yet for **3-3** in the repo; treat **`_bmad-output/planning-artifacts/epics.md`** (Story 3.3 AC) and **`ux-design-specification.md`** (`AddTodoForm` section) as the layout contract.

## Acceptance Criteria

1. **Given** the bottom **`AddTodoForm`** (**Enter** submits when the field is focused—**UX-DR12**)  
   **When** I submit **valid** text (non-empty, within server **`maxLength`**—see API contract)  
   **Then** the **primary Add** control uses the **teal** hierarchy (**UX-DR4**) and shows **in-flight disabled** state (**opacity** + **`cursor-not-allowed`** per **UX-DR4** / **project-context**)

2. **Given** a pending create mutation  
   **When** I attempt **duplicate submit** (second click, second **Enter**, or rapid double-action)  
   **Then** submission is **blocked** while the mutation is pending (**FR13**)—e.g. **`disabled`** on submit **and** form **`onSubmit`** guard so programmatic double-fire does not enqueue a second **POST**

3. **Given** a successful create  
   **When** the API returns **201** with the **full todo**  
   **Then** the list reflects **server truth** (**FR26**) via **`queryClient.invalidateQueries({ queryKey: ['todos'] })`** or an equivalent **cache update** that reconciles on **`id` / `updatedAt`** (prefer **invalidation** unless you already established **optimistic** patterns in 3.2—stay consistent)

4. **Given** a failed create (**400** validation, **5xx**, network)  
   **When** the mutation settles as error  
   **Then** an **inline** message near the composer **or** reuse of the existing **banner** pattern shows **plain-language**, **actionable** copy (**FR12**, **UX-DR5**) mapped through **`mapApiError`** (or the single error module introduced in 3.2)—**no** raw JSON, stack traces, or internal messages in the UI (**NFR-S3**)

5. **Given** Vitest + Testing Library setup in **`client/`**  
   **When** component tests run  
   **Then** they cover **submit disabled while pending** and a **success path** (mocked **`fetch`** or **MSW**, or **`QueryClient` + mocked API function**) so regressions on **FR13** are caught

6. **Given** Playwright under **`e2e/`**  
   **When** E2E runs against a **documented** environment (running API + client, or agreed test double)  
   **Then** a spec covers the **add todo** journey: type → submit → new row visible (or list refetched) **without** duplicate rows from a **single** user intent

## Tasks / Subtasks

- [x] **API client: create** (AC: #3–4)  
  - [x] Add **`createTodo({ text: string })`** (or extend existing **`todoApi`**) calling **`POST ${VITE_API_BASE_URL}/todos`** with body **`{ text }`**  
  - [x] Expect **201** and parse the **Todo** JSON body (full entity: **`id`**, **`text`**, **`completed`**, **`createdAt`**, **`updatedAt`**)—matches **`api/routes/todos/index.js`** and OpenAPI **`Todo`** schema [Source: `api/schemas/todos-contract.js`]  
  - [x] On non-OK, parse **`{ error: { code, message, details? } }`** and throw or return a typed error for **`mapApiError`**

- [x] **TanStack Query mutation** (AC: #2–3)  
  - [x] **`useMutation`** for create with stable **`mutationKey`** (e.g. **`['todos', 'create']`**) aligned with architecture  
  - [x] **`onSuccess`**: invalidate **`['todos']`** (or update cache)—**no** parallel **`useState`** list as source of truth  
  - [x] **`isPending`** (v5) drives **disabled** state; consider **`mutate`** vs **`mutateAsync`** for error handling in the form

- [x] **`AddTodoForm` wiring** (AC: #1–4)  
  - [x] Controlled or uncontrolled input per existing 3.3 code; **clear input on success** (optional but matches “frictionless capture” in UX spec)  
  - [x] **`onSubmit`**: `preventDefault`; if **`isPending`** return early; else trigger mutation  
  - [x] **Enter** in text field submits (native **`type="submit"`** + single form, or **`onKeyDown`**) per **UX-DR12**  
  - [x] Inline error state for mutation errors; ensure screen readers get **`aria-live`** or associated **`aria-describedby`** if you use a live region

- [x] **Tests** (AC: #5)  
  - [x] Co-locate **`AddTodoForm.test.tsx`** (or project convention from 3.2/3.3)  
  - [x] Assert: after submit, **button/input** disabled while promise pending; re-enabled after settle  
  - [x] Assert: success path triggers invalidation or list update (spy on **`queryClient.invalidateQueries`** or assert rendered row)

- [x] **E2E** (AC: #6)  
  - [x] Extend **`e2e/tests/`** (replace or augment **`smoke.spec.ts`** pattern) with **add todo** flow; document **`BASE_URL`** / API dependency in **`README`** or **`e2e/README`** if needed

## Dev Notes

### Technical requirements

- **REST:** Locked prefix **`/todos`** (not `/api/todos`). Base URL from **`import.meta.env.VITE_API_BASE_URL`** (see **`client/.env.example`**). [Source: `api/routes/todos/index.js` header comment]
- **POST create:** **`201`**, body = **single Todo object** (not wrapped in `{ todo: ... }`). **GET list** remains **`{ todos: [...] }`**.
- **Validation:** Server **`text`** **`minLength: 1`**, **`maxLength: 10_000`** (`MAX_TEXT_LENGTH` in **`api/schemas/todos-contract.js`**). Client may mirror for UX but server wins.
- **Mutations:** **No blind retry** on **POST** per **`project-context.md`**; user must submit again after failure.
- **TanStack Query:** v5 **`isPending`** on mutations; align with **`@tanstack/react-query`** added in 3.2.

### Architecture compliance

- Server state **only** through Query; **`queryKey`** **`['todos']`** for list invalidation. [Source: `_bmad-output/planning-artifacts/architecture.md` — Communication Patterns]
- Errors via **one** mapping module (**`mapApiError`**) shared with list error UI. [Source: `architecture.md` — Loading/Errors]
- Component/file naming: **PascalCase** components, **camelCase** modules (**`todoApi.ts`**). [Source: `project-context.md`]

### Library and dependencies

- **`@tanstack/react-query`** (from 3.2)—this story does **not** add alternate state libraries.
- Optional: **`@tanstack/react-query-devtools`** only if already adopted in 3.2.

### File structure (expected touches)

| Area | Path (adjust to match 3.2/3.3 outputs) |
|------|--------------------------------------|
| API client | `client/src/api/todoApi.ts` or `client/src/todos/todoApi.ts` |
| Mutation hook | `client/src/todos/useCreateTodoMutation.ts` or co-located in form |
| Form UI | `client/src/todos/AddTodoForm.tsx` (from 3.3) |
| Tests | `client/src/todos/AddTodoForm.test.tsx` (or co-located pattern) |
| E2E | `e2e/tests/*.spec.ts` |

### Testing requirements

- **Vitest** + **Testing Library**; mock network at **`fetch`** or client boundary so tests stay fast and deterministic.
- **Playwright:** follow existing **`e2e/playwright.config.ts`**; ensure CI story (Epic 1) still passes when this spec is added.

### UX and accessibility

- **UX-DR4:** Teal primary **Add**; disabled during flight with visible **focus-visible** when focusable. [Source: `_bmad-output/planning-artifacts/epics.md` FR / UX rows, `ux-design-specification.md` — AddTodoForm]
- **Add journey diagram:** `_bmad-output/planning-artifacts/ux-design-specification.md` (Journey: Add todo from bottom composer).

### Previous story intelligence

- **3-3** artifact not present yet. From **epics.md**: **Direction 9** = title → scrollable **`flex-1` `min-h-0`** list → **bottom `AddTodoForm`** with **top border**; **empty state** keeps composer visible.
- **3-2** artifact not present yet. From **epics.md** + **architecture**: expect **`QueryClientProvider`**, list **`useQuery`**, **`QueryErrorBanner`**, **`mapApiError`**.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Story 3.4]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` — Add todo journey, AddTodoForm]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — State, mutations, errors, JSON shapes]
- [Source: `_bmad-output/planning-artifacts/prd.md` — FR2, FR12, FR13, FR26, NFR-P1]
- [Source: `_bmad-output/project-context.md` — Query keys, double-submit, POST retry, error mapping]
- [Source: `api/routes/todos/index.js` — POST 201, GET envelope]
- [Source: `api/schemas/todos-contract.js` — request/response schemas]

## Dev Agent Record

### Agent Model Used

Composer (Cursor agent)

### Debug Log References

### Completion Notes List

- Implemented **`createTodo`** in **`client/src/api/todoApi.ts`** (POST, 201 body validation, **`mapApiError`** on failure).
- Added **`useCreateTodoMutation`** (`mutationKey` **`['todos','create']`**, **`retry: false`**, **`invalidateQueries`** on **`TODOS_QUERY_KEY`**).
- Wired **`AddTodoForm`**: controlled input, **`isPending`** + ref guard against double submit, teal primary + disabled opacity/cursor, inline **`role="alert"`** + **`aria-describedby`** on validation errors, clear text on success.
- **`AddTodoForm.test.tsx`**: pending disables controls, invalidation spy, double **`submit`** → one POST, mapped 400 error copy.
- **`e2e/tests/add-todo.spec.ts`**: type unique label → Add → assert **`listitem`** (stack documented in file comment; same as 3.3 specs).
- Local **`npm run test:e2e`** failed only because **`127.0.0.1:3000`** was already in use (dev server); **`npm run build --workspace client`** passes after **`FormEvent`** type-only import fix.

### File List

- `client/src/api/todoApi.ts`
- `client/src/todos/useCreateTodoMutation.ts`
- `client/src/todos/AddTodoForm.tsx`
- `client/src/todos/AddTodoForm.test.tsx`
- `e2e/tests/add-todo.spec.ts`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Change Log

- 2026-04-10: Story 3.4 — add todo API client, create mutation, form wiring, Vitest coverage, Playwright add-todo spec.

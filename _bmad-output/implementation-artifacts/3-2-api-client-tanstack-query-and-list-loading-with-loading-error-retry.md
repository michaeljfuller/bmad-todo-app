# Story 3.2: API client, TanStack Query, and list loading with loading/error/retry

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want the **todo list to load** with **immediate loading feedback** and **recoverable errors**,
so that **I never stare at a blank void** and can **retry** when something fails (**FR10**, **FR11**, **NFR-P2**, **UX-DR5**).

## Acceptance Criteria

1. **Env and base URL** — Given the API is reachable, the client resolves the API origin from **`import.meta.env.VITE_API_BASE_URL`** (documented in **`client/.env.example`** as **`http://localhost:3000`** with **no** path suffix). All HTTP calls use that base plus the locked REST prefix **`/todos`** (same as OpenAPI and `api/README.md` — [Source: `api/README.md` — Endpoints table]).
2. **TanStack Query list fetch** — When the app mounts, a **`useQuery`** (or thin wrapper hook) fetches **`GET {VITE_API_BASE_URL}/todos`** and receives **`{ "todos": Todo[] }`** with **camelCase** fields (`id`, `text`, `completed`, `createdAt`, `updatedAt` as ISO 8601 strings). Use a stable **`queryKey`**: **`['todos']`** (align future mutations/invalidation with this scheme — [Source: `_bmad-output/project-context.md` — Framework-Specific Rules]).
3. **QueryClient wiring** — **`QueryClientProvider`** wraps the app tree (typically in **`client/src/main.tsx`**). Default options: sensible **`staleTime`** for list (e.g. short or zero for v1 honesty); **GET** may use limited **`retry`** (e.g. 1–2) — **do not** apply blind aggressive retries to future **POST** mutations in this story ([Source: `_bmad-output/project-context.md` — Critical Don't-Miss — GET retries optional; POST no blind retry]).
4. **Loading UX (list region)** — While the query is in a **pending / no-data** state on first load, the **list region** shows **immediate** non-empty feedback: **skeleton placeholders** and/or **short copy** (e.g. “Loading todos…”) — **not** an empty panel that could read as “no todos” (**NFR-P2**, **UX-DR5**). Use TanStack Query **v5** semantics: prefer **`isPending`** (and/or **`status === 'pending'`**) for “first load without data” vs background refetch ([Source: `_bmad-output/planning-artifacts/architecture.md` — UI patterns — Query]).
5. **Error UX + Retry** — On fetch failure, show a **`QueryErrorBanner`** (or equivalent name) with **plain language** (no raw JSON, no stack traces) and a **Retry** control wired to **`refetch()`** from the query result (**UX-DR3**, **UX-DR5**, **NFR-S3**).
6. **Central error mapping** — All user-visible error strings for API failures go through **one small module** (e.g. **`client/src/api/mapApiError.ts`**) that maps HTTP status and/or **`error.code`** from the standard envelope **`{ "error": { "code", "message", "details?" } }`** to safe copy ([Source: `_bmad-output/project-context.md` — API errors / User-facing errors]).
7. **Component tests** — **Vitest** + Testing Library cover: **loading** state (e.g. mock **`fetch`** or MSW so the query stays pending); **error + retry** (failed fetch then success on second attempt). Co-locate **`*.test.tsx`** with components or follow the **single convention** already used under **`client/src/`** ([Source: `_bmad-output/project-context.md` — Testing Rules]).
8. **E2E** — Extend **`e2e/tests/`** with a spec that proves **list load** happy path: with **real API + client** running, opening the app shows todos from the server (or an **empty keyed list**). Document in the story completion / README how CI or local runs start **API** (migrations/DB) and **client** with matching **`VITE_API_BASE_URL`** and **`CORS_ORIGIN`** — today there is **no** `webServer` in **`e2e/playwright.config.ts`**, so either add **`webServer`** / **`baseURL`** orchestration or document the required parallel processes ([Source: `README.md` — Development]).

## Ordering note (Epic 3)

**Story 3.1** (Tailwind design tokens) may land before or after this work in the branch. If **3.1** is already merged, use the **semantic Tailwind tokens** from that story for surfaces, text, errors, and loading. If not, use **accessible minimal styling** (semantic HTML, clear contrast) so behavior and tests are correct; **re-skin** when 3.1 merges without changing Query or error-handling semantics.

## Tasks / Subtasks

- [ ] **Dependencies** (AC: #2, #3)
  - [ ] Add **`@tanstack/react-query@^5`** to **`client/package.json`**; run install from repo root per workspaces.
- [ ] **API surface** (AC: #1, #2, #6)
  - [ ] Add **`client/src/api/todoApi.ts`** (or equivalent): **`fetchTodos()`** building URL from **`import.meta.env.VITE_API_BASE_URL`**, **`GET /todos`**, parse **`{ todos }`**, export a **`Todo`** **TypeScript** type matching the API ([Source: `api/schemas/todos-contract.js` / OpenAPI]).
  - [ ] Add **`client/src/api/mapApiError.ts`**: parse JSON error body when present; map to a **`userMessage`** string; never surface **`error.message`** from the server verbatim if it looks internal — prefer status-based fallbacks for **5xx** ([Source: architecture — Error format]).
- [ ] **Query + UI** (AC: #2–#5)
  - [ ] Wrap app with **`QueryClientProvider`** in **`main.tsx`**.
  - [ ] Implement **`useTodosQuery()`** (e.g. under **`client/src/todos/`** or **`client/src/hooks/`**) with **`queryKey: ['todos']`** and **`queryFn`** calling **`fetchTodos`**.
  - [ ] Replace or narrow the Vite starter **`App.tsx`** to the todo shell needed for this story: **title/heading**, **list region** with loading / error / success branches, **`QueryErrorBanner`** with **Retry**.
- [ ] **Tests** (AC: #7)
  - [ ] Component/integration-style tests for loading and error+retry (mock **`global.fetch`** or use MSW if already introduced — **do not** add MSW unless the team prefers it; **`fetch` mock is sufficient**).
- [ ] **E2E** (AC: #8)
  - [ ] New Playwright spec: navigate to client **`baseURL`**, assert list area eventually shows **either** rows from API **or** empty list after successful load (use **`data-testid`** or roles for stability).
  - [ ] Update **`e2e/playwright.config.ts`** and/or root **`package.json`** scripts if you add **`webServer`** to automate API+client startup for CI; otherwise document manual/CI steps in **`README.md`**.
- [ ] **Regression** (AC: all)
  - [ ] Update **`client/src/App.test.tsx`** (or replace) so root tests match the new app entry — **no** stale “Get started”-only assertion.

## Dev Notes

### Technical requirements

- **Single source of server list state:** TanStack Query only — no parallel canonical **`useState`** copy of the full list ([Source: `_bmad-output/project-context.md` — Server data]).
- **JSON:** **camelCase**; dates **ISO 8601** strings ([Source: `project-context.md` — HTTP JSON / Dates in API]).
- **CORS:** For browser calls from **`http://localhost:5173`**, **`api/.env`** **`CORS_ORIGIN`** must match the Vite origin ([Source: `2-4` story — CORS]).

### Architecture compliance

- **TanStack Query v5** for list load — [Source: `_bmad-output/planning-artifacts/architecture.md` — Important Decisions / Client sync].
- **Immediate loading in list area** — [Source: `architecture.md` — UI patterns / NFR-P2 alignment].
- **Vite public env** — only **`VITE_*`** exposed — [Source: `architecture.md` — Configuration].

### Library / framework requirements

| Package | Role |
|---------|------|
| `@tanstack/react-query` | `QueryClient`, `QueryClientProvider`, `useQuery` |

Lockfile is source of truth after install ([Source: `project-context.md` — Dependency versions]).

### File structure requirements

| Area | Suggested path |
|------|----------------|
| API fetch + types | `client/src/api/todoApi.ts` |
| Error mapping | `client/src/api/mapApiError.ts` |
| List / banner components | `client/src/todos/*.tsx` or `client/src/components/*.tsx` |
| Query hook | `client/src/todos/useTodosQuery.ts` (or co-located) |
| App entry | `client/src/main.tsx`, `client/src/App.tsx` |
| Tests | `client/src/**/*.test.tsx` |
| E2E | `e2e/tests/*.spec.ts` |

Match existing **PascalCase** components / **camelCase** modules ([Source: `project-context.md` — Code Quality]).

### Testing requirements

- **Vitest** + **jsdom** (already in **`client/vite.config.ts`**).
- Prefer **role** and **accessible names** for queries (**Retry** button, headings) — aligns with **UX-DR6** / NFR-A baseline for later stories.

### Previous story intelligence

- **No `3-1-*` story file** exists yet; **Epic 2** delivered **`GET /todos`** keyed **`{ todos }`**, **OpenAPI**, and **CORS** — [Source: `_bmad-output/implementation-artifacts/2-4-openapi-contract-cors-configuration-and-ci-job-for-api-integration-tests.md`].
- **Client scaffold** is still the Vite welcome screen — [Source: `client/src/App.tsx`].
- **E2E** is minimal smoke only — [Source: `e2e/tests/smoke.spec.ts`].

### Project context reference

- Treat **`_bmad-output/project-context.md`** as mandatory for Query keys, error shape, and file naming.

### UX reference

- **Open app → load list** journey and error/retry diagram — [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` — Journey: Open app and load list].
- **Direction 8** (error + Retry) in **`ux-design-directions.html`** — visual reference only (**UX-DR11** for mockups).

## Dev Agent Record

### Agent Model Used

_(filled by dev agent)_

### Debug Log References

### Completion Notes List

### File List

_(filled by dev agent on completion)_

---

_Ultimate context engine analysis completed — comprehensive developer guide created._

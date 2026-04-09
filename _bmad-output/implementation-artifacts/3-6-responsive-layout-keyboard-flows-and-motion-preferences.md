# Story 3.6: Responsive layout, keyboard flows, and motion preferences

Status: ready-for-dev

<!-- Ultimate context engine analysis completed — comprehensive developer guide created. -->

## Story

As a **user**,
I want the app to work on **phone and desktop** with **keyboard-only** core flows,
so that **I am not blocked by viewport or input mode** (**FR15**, **FR16**, **NFR-A1**, **UX-DR6**, **UX-DR7**).

## Acceptance Criteria

1. **Given** narrow and wide viewports **when** the user completes core flows (scan list, toggle complete, delete, add todo) **then** there is **no horizontal scroll** on those primary flows and **Add** plus row actions (checkbox, delete control) meet **~44px** minimum touch targets (**UX-DR7**, **FR15**).
2. **Given** keyboard-only use **when** the user presses **Tab** / **Shift+Tab** through the todo experience **then** **focus order** follows **title → list (each row in order) → composer** (**FR16**, **UX-DR6**); **Space** toggles the row checkbox when focused; **Enter** submits **Add** when the composer field is focused (**UX-DR6**).
3. **Given** the dark-first UI **when** any interactive control receives keyboard focus **then** **focus rings** are clearly visible (high-contrast `focus-visible` treatment, not relying on low-contrast or browser-default-only styling) (**UX-DR6**, **NFR-A1**).
4. **Given** **`prefers-reduced-motion: reduce`** **when** the UI shows transitions or loading spinners **then** motion is **reduced or removed** (instant state changes or opacity-only where appropriate) (**UX-DR6**).
5. **Verification:** **Component** and/or **E2E** tests **document the keyboard path**; if full automation is deferred, add a **manual keyboard checklist** to **`README.md`** (root or `client/`, matching where other dev docs live) with explicit steps (Tab order, Space on checkbox, Enter on add) so QA cannot skip it (**per epics.md Story 3.6**).

## Tasks / Subtasks

- [ ] **Prerequisites** (AC: all)
  - [ ] Confirm **Story 3.1** (Tailwind tokens), **3.3** (TodoApp shell / Direction 9), **3.4** (AddTodoForm), and **3.5** (Todo rows) are implemented — this story **polishes** layout, focus, and motion on top of those components; if executed early, still apply changes in the **intended** `TodoApp` / `TodoList` / `TodoItem` / `AddTodoForm` structure from Architecture.
- [ ] **Responsive layout** (AC: #1)
  - [ ] Audit **primary column** width: mobile-first **full width** with horizontal padding; optional **max-width** on large breakpoints (**UX-DR7**); ensure list + composer do not force **`overflow-x`** on `body` / root shell.
  - [ ] Enforce **~44px** minimum hit areas on **Add** primary control and row actions (checkbox hit slop and delete button) without breaking **Direction 9** flex layout (`flex-1`, `min-h-0` on scroll region preserved).
- [ ] **Keyboard order & semantics** (AC: #2)
  - [ ] Ensure **DOM order** matches **title → list → composer**; avoid positive **`tabIndex`** except rare focus fixes (prefer reordering markup).
  - [ ] Verify **checkbox** is a real **`input type="checkbox"`** (or equivalent with correct role) with **label** / **`aria-labelledby`** to todo text (**UX-DR6**, builds on 3.5).
  - [ ] Confirm **Delete** has an **accessible name** (visible text or **`aria-label`**) and remains reachable by keyboard.
- [ ] **Focus-visible styling** (AC: #3)
  - [ ] Add shared **`focus-visible`** ring utilities (Tailwind `ring-*` / `outline-*`) using **token colors** that meet contrast on **dark** surfaces; apply consistently to buttons, inputs, and custom row controls.
- [ ] **`prefers-reduced-motion`** (AC: #4)
  - [ ] Wrap **CSS transitions** and **spinner/animation** classes in **`@media (prefers-reduced-motion: reduce)`** overrides **or** Tailwind **`motion-reduce:*`** variants so loading and micro-interactions respect user preference.
- [ ] **Tests & documentation** (AC: #5)
  - [ ] Prefer **Playwright** (existing **`e2e/`** scaffold) for a **keyboard smoke**: tab to composer, Enter to submit (with mocks or live API per project norm), Space on checkbox — **or** **Vitest** + Testing Library **`userEvent.keyboard`** for focus order where reliable.
  - [ ] If automation is incomplete, **README** section: numbered steps for **keyboard-only** path and **reduced-motion** check (OS/browser setting + expected behavior).

## Dev Notes

### Epic and dependency context

- **Epic 3 goal:** Single-screen calm experience with **UX-DR1–UX-DR12** and **NFR-A1–A2** baseline (**epics.md** Epic 3 overview).
- **This story** explicitly maps **FR15**, **FR16**, **NFR-A1**, **UX-DR6**, **UX-DR7**; it does **not** replace **3.7** (reload trust / server alignment / broader E2E error journeys).
- **Prior Epic 3 story files** under `_bmad-output/implementation-artifacts/` may not exist yet; use **`_bmad-output/planning-artifacts/epics.md`** Stories **3.3–3.5** plus **`ux-design-specification.md`** for row/shell behavior already specified there.

### Architecture compliance

- **Frontend home:** `client/src/todos/*` (or equivalent) per **`_bmad-output/planning-artifacts/architecture.md`** FR coverage table — keep changes in the todo feature module, not ad-hoc globals unless token/global CSS is the right layer for motion/focus defaults.
- **Accessibility baseline:** **NFR-A2** semantic structure (headings, list regions) must remain intact; **full WCAG audit** is **not** a v1 gate unless added later — this story targets **PRD-aligned** keyboard, focus, and motion (**NFR-A1**).
- **Performance:** Do not introduce **sustained UI lockup** during tabbing or layout; **NFR-P3** remains satisfied.

### Technical requirements (guardrails)

- **No horizontal scroll:** Check **320px** (or project-defined minimum) and **desktop** widths; fix overflow from fixed widths, long unbroken strings in todo text (consider **`word-break`** / **`overflow-wrap`** on row text if needed).
- **Touch targets ~44px:** Use **`min-h-[44px]`** / **`min-w-[44px]`** or Tailwind spacing scale equivalents; align checkbox **clickable** area with visible row (extend hit target, not tiny input only).
- **Focus vs hover:** Style **`:focus-visible`**, not `:focus` alone for mouse users, to avoid ugly rings on click where appropriate.
- **Reduced motion:** Apply to **skeleton pulse**, **spinner rotation**, **transition-all** on panels — grep `client/src` for `transition`, `animate-`, `keyframes`, and loading components added in **3.2+**.

### File structure (expected touchpoints)

- `client/src/todos/**` — `TodoApp`, `TodoList`, `TodoItem`, `AddTodoForm`, loading/error subcomponents.
- `client/src/index.css` or **`tailwind`** entry / **@layer** — global `prefers-reduced-motion` and optional base `focus-visible` defaults.
- `tailwind.config.*` — only if extending theme for ring/focus tokens (Story 3.1 may already define semantic colors).
- `e2e/**/*.spec.ts` — keyboard journey if automated.
- `README.md` (root) or `client/README.md` — manual checklist **only if** automation is deferred (still required by AC).

### Testing requirements

- **Vitest + Testing Library:** Tab order tests are **fragile** if they depend on every nested element; prefer testing **document order** of key landmarks or **`userEvent.tab()`** sequences on a **small mounted tree** with explicit expectations.
- **Playwright:** `keyboard.press('Tab')` loop with **timeouts** and **visible** focus assertions (`toBeFocused()` on role/name) — stable if **`data-testid`** on shell regions is already established in earlier stories.
- **Coverage:** Epic 3 expects **component tests as you build**; extend existing suites rather than new runners.

### Library / framework

- **React 19**, **Vite 8**, **TypeScript**, **TanStack Query v5** (when present) — no new state libraries; **Tailwind** per **3.1** (**project-context.md**).

### Previous story intelligence

- **No `3-5-*.md`** (or other **3-x** story files) in `_bmad-output/implementation-artifacts/` at story creation time — **epics.md** Story **3.5** defines labeled checkbox, delete styling, and metadata; **implement 3.6 as refinement** on top of that UI once it exists.

### Latest technical notes (no version pin required)

- **`prefers-reduced-motion`:** [MDN `prefers-reduced-motion`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion) — use **CSS media query** or Tailwind **`motion-reduce:`** variants (Tailwind v3.4+); verify against a real browser toggle (macOS **Reduce motion**, Windows **Show animations**).

### Project context reference

- Read **`_bmad-output/project-context.md`** — **E2E minimum** journeys, **Testing Rules**, **NFR-A** alignment, and **client** stack before coding.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Story 3.6, Epic 3 overview]
- [Source: `_bmad-output/planning-artifacts/epics.md` — UX-DR6, UX-DR7 in Requirements Inventory]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` — Accessibility / motion / responsive sections]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — NFR-A, client path `client/src/todos/*`]
- [Source: `_bmad-output/project-context.md` — stack, testing, accessibility posture]

## Dev Agent Record

### Agent Model Used

_(filled by dev agent)_

### Debug Log References

### Completion Notes List

### File List

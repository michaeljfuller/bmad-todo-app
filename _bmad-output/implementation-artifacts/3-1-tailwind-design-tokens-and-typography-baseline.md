# Story 3.1: Tailwind design tokens and typography baseline

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user** (Alex),
I want a **dark-first, calm visual baseline** with **readable typography**,
so that **the app feels professional and easy to scan** (**UX-DR1**, **UX-DR12**, emotional goals from UX spec).

## Acceptance Criteria

1. **Tailwind + Vite wiring** — Given the **`client/`** app, when dependencies and config are added per the **official Tailwind “Using Vite”** installation guide, then **`content`** (or the v4 equivalent scan paths) covers **`index.html`** and **`src/**`** so utilities are generated for all app source.
2. **Semantic token layers** — **`tailwind.config`** (or, if using Tailwind v4’s CSS-first setup, an equivalent single documented token layer such as **`@theme` in `src/index.css`**) defines **semantic** colors at least for:
   - **Surfaces:** page, panel, row (layered neutrals—avoid pure `#000` page + pure `#fff` body text without verification; align with UX “layered dark neutrals”).
   - **Text:** primary, secondary (metadata), **muted** (supporting lines).
   - **Accent:** **teal** referencing **`#2dd4bf`** (UX Direction 9 / UX spec).
   - **Semantic UI:** **error** hue suitable on dark surfaces; **completed** text treatment **distinct** from **disabled** control styling (**UX-DR9** precursor—tokens must be separate so later stories do not conflate “done todo” with “inactive control”).
3. **Typography baseline** — Body typography uses the **system UI stack** first (`system-ui`, `Segoe UI`, `Roboto`, `Helvetica Neue`, `Arial`, sans-serif per UX spec). Base **font size** and **line-height** support comfortable reading on dark backgrounds (no dependency on a webfont in this story unless the team explicitly adds one).
4. **WCAG contrast callouts** — In **Dev Notes** (or a short comment adjacent to token definitions), document **which token pairs** must meet **WCAG 2.1 AA** intent for core flows: **body text on page**, **primary button** (teal fill + label), **error text/background**, and **focus-visible** ring vs surface—plus **how** the implementer should verify (e.g. browser devtools contrast or manual checklist). Full formal audit can wait; this story requires **explicit pairs + verification note** (**UX-DR6**).
5. **Component test** — At least **one** Vitest + Testing Library test renders a **small placeholder** (e.g. `DesignSurfaceSample` or minimal shell fragment) that uses **semantic token classes** (not raw ad-hoc hex in the component), proving the token pipeline applies in tests (**jsdom**).

## Prerequisites

- **Epic 2** complete: API, OpenAPI, CORS, integration tests in CI—this story **does not** change the API.
- **Client** is the existing Vite 8 + React 19 + TypeScript scaffold under **`client/`** (starter **`App.tsx`** / **`App.css`** / **`index.css`** may be **replaced or heavily simplified** to adopt Tailwind—avoid carrying unused starter CSS long term).

## Tasks / Subtasks

- [ ] **Install Tailwind for Vite** (AC: #1)
  - [ ] Add packages per current Tailwind docs for Vite (e.g. **`tailwindcss`** + **`@tailwindcss/vite`** for Tailwind v4, or the v3 **PostCSS** path if the team standardizes on v3—**lockfile** is source of truth after install).
  - [ ] Register the Vite plugin (or PostCSS pipeline) in **`client/vite.config.ts`**; ensure **`npm run build`** and **`npm run dev`** still work.
- [ ] **Token layer** (AC: #2, #3, #4)
  - [ ] Define semantic colors and typography in **`tailwind.config.*`** and/or **`src/index.css`** (`@import "tailwindcss"` / `@theme`) per chosen Tailwind major version; **names** should be **semantic** (e.g. `surface-page`, `text-primary`, `accent-primary`, `text-completed`, `text-disabled`, `surface-error` or consistent `bg-*` / `text-*` mapping—pick one naming scheme and document it in Dev Notes).
  - [ ] Apply **dark-first** defaults: the shipped **default appearance** should read as **professional dark** (per UX), not light-first with optional dark mode—align with **UX-DR** “default to dark UI.”
  - [ ] Add **WCAG-oriented notes** for the pairs listed in AC #4.
- [ ] **Root styles + app shell placeholder** (AC: #1–#3)
  - [ ] Wire **`main.tsx`** imports so global styles load once; remove or slim **legacy** **`App.css`** / **`index.css`** starter rules that conflict with the new baseline (keep **`#root` / `body` margin** behavior sensible for the todo app).
  - [ ] Replace the marketing-style starter **`App`** with a **minimal** placeholder that demonstrates **semantic surfaces + typography** (enough for Story 3.2+ to replace with real todo UI—**no** TanStack Query in this story).
- [ ] **Tests** (AC: #5)
  - [ ] Add **`*.test.tsx`** co-located with the placeholder component (or next to **`App`**) asserting a **token-based** background/text class renders (use **`toHaveClass`** or role + computed style as appropriate—avoid testing implementation details unrelated to tokens).
  - [ ] Update **`App.test.tsx`** if the default headline/copy changes so **`npm test`** in **`client/`** stays green.

## Dev Notes

### Technical requirements

- **Stack:** React 19 + Vite 8 + TypeScript + Vitest 4 + Testing Library—**do not** add TanStack Query, API client, or Playwright product journeys here ([Source: `_bmad-output/project-context.md` — Technology Stack]).
- **Styling:** Tailwind as **primary** styling system; semantic tokens—not scattered hex in components ([Source: `_bmad-output/planning-artifacts/ux-design-specification.md` — Component Library Strategy / Visual Foundation]).
- **Spacing:** Prefer **4px base / 8px multiples** for section gaps when applying utilities ([Source: UX spec — Spacing & layout foundation]).
- **Accent reference:** Teal **`#2dd4bf`**, panel reference **`#1a1f2e`** (map into Tailwind theme, not hardcoded in every component) ([Source: UX spec — Color; Direction 9]).

### Architecture compliance

- Client lives under **`client/`** with **`src/`** entry at **`main.tsx`** ([Source: `_bmad-output/planning-artifacts/architecture.md` — Project Structure]).
- Styling solution: Architecture allows adding **Tailwind** after Vite scaffold ([Source: `architecture.md` — Starter Template / Styling solution]).
- CI expectation: **`client` production build** remains part of the pipeline—verify **`npm run build`** after changes ([Source: `architecture.md` — CI / PR enforcement]).

### Library / framework requirements

- Use **Tailwind versions compatible with Vite 8**; follow [Tailwind CSS: Using Vite](https://tailwindcss.com/docs/installation/using-vite) as the canonical install path unless a team pin dictates otherwise.
- If choosing between Tailwind **v3** (PostCSS + `tailwind.config` `theme.extend`) and **v4** (`@tailwindcss/vite` + CSS `@theme`), **either is acceptable** provided AC #2’s semantic layers exist in **one** clear place and **`content`/scan paths** include **`src/**`**.

### File structure requirements

| Area | Path |
|------|------|
| Vite config | `client/vite.config.ts` |
| Global CSS entry | `client/src/index.css` (Tailwind imports + optional `@theme`) |
| Tailwind config | `client/tailwind.config.ts` or `.js` (as required by chosen major version) |
| App entry | `client/src/main.tsx` |
| Placeholder UI | `client/src/App.tsx` and/or `client/src/components/...` (feature-neutral name) |
| Unit tests | Co-located `*.test.tsx` per `project-context` (client convention) |

### Testing requirements

- **Vitest** + **jsdom** + **Testing Library**—existing **`client/vite.config.ts`** `test` block ([Source: current `client/vite.config.ts`]).
- One test must assert **tokenized** surface/text—not a snapshot of the entire marketing page.
- **No** new E2E requirement in this story (product E2E belongs to later Epic 3 stories).

### Previous story intelligence

- **Story 2.4** established OpenAPI, CORS, and CI for **API** integration tests—**no** API or **`api/`** changes for 3.1 ([Source: `_bmad-output/implementation-artifacts/2-4-openapi-contract-cors-configuration-and-ci-job-for-api-integration-tests.md`]).
- Epic 3 **depends on Epic 2** for data; this story only prepares **visual baseline** for subsequent **`TodoApp`** work ([Source: `_bmad-output/planning-artifacts/epics.md` — Epic 3 goal]).

### Latest technical information

- **Tailwind v4** typically uses **`@import "tailwindcss"`** in CSS and the **`@tailwindcss/vite`** plugin; **v3** uses **`@tailwind` directives** and PostCSS. Match the installed major version’s docs to avoid mixing v3/v4 syntax.
- After `npm install`, treat **`package-lock.json`** as authoritative for exact versions committed to the repo.

### Project context reference

- Co-locate **`*.test.tsx`**; aim for **≥70%** unit coverage over time—this story should not drop coverage sharply ([Source: `_bmad-output/project-context.md` — Testing Rules]).
- **PascalCase** components, **`use*`** hooks for future stories ([Source: `project-context.md` — Framework-Specific Rules]).

### Cross-story boundaries (do not scope-creep)

- **Story 3.2** adds **TanStack Query**, API base URL, loading/error/retry—**not** in 3.1.
- **Story 3.3** adds **TodoApp** shell, Direction 9 layout, empty state—placeholder layout in 3.1 should be **minimal**, not the full list/composer structure.

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

---

**Story completion status:** Ultimate context engine analysis completed — comprehensive developer guide created.

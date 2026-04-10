# Deferred work

## Deferred from: code review of 3-1-tailwind-design-tokens-and-typography-baseline.md (2026-04-09)

- **`--color-focus-ring` vs sample button:** Theme defines `focus-ring`; placeholder primary button uses `ring-fg-primary`. Comments already reserve `outline-focus-ring` for future dark-surface controls — follow up when keyboard/focus stories tighten semantics.
- **Responsive base font size:** Global typography is `1rem` / `1.5` without a sub-`1024px` font-size tweak that the old scaffold had — confirm comfortable reading on small viewports during UX polish.

## Deferred from: code review of 2-1-sqlite-database-drizzle-schema-and-migrations-for-todos.md (2026-04-09)

- Root CI workflow runs E2E only and does not run root `npm test` (which includes the api workspace and the new migration test). Native install still runs via `npm ci`, but migration/unit coverage is local-only until CI is extended (e.g. Epic 2.4).

## Deferred from: code review of 3-3-todoapp-shell-direction-9-layout-and-empty-state.md (2026-04-10)

- **Story Tasks vs mocks:** Tasks still describe mocking `useQuery` with `{ data: { todos: [] } }`; implementation correctly mocks `useTodosQuery` with `data: []`. Update the story template or dev notes so future slices do not copy the wrong shape.
- **`layout.children` order:** `TodoApp.test.tsx` asserts shell order via `children[0]`/`[1]`/`[2]`, which breaks if a wrapper or text node appears. Prefer querying by role/`data-testid` only.
- **`as unknown as` mock return:** Acceptable workaround for `tsc -b` including tests; revisit when shared query-result mock helpers or stricter partial types exist.

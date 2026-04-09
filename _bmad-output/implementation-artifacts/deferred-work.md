# Deferred work

## Deferred from: code review of 3-1-tailwind-design-tokens-and-typography-baseline.md (2026-04-09)

- **`--color-focus-ring` vs sample button:** Theme defines `focus-ring`; placeholder primary button uses `ring-fg-primary`. Comments already reserve `outline-focus-ring` for future dark-surface controls — follow up when keyboard/focus stories tighten semantics.
- **Responsive base font size:** Global typography is `1rem` / `1.5` without a sub-`1024px` font-size tweak that the old scaffold had — confirm comfortable reading on small viewports during UX polish.

## Deferred from: code review of 2-1-sqlite-database-drizzle-schema-and-migrations-for-todos.md (2026-04-09)

- Root CI workflow runs E2E only and does not run root `npm test` (which includes the api workspace and the new migration test). Native install still runs via `npm ci`, but migration/unit coverage is local-only until CI is extended (e.g. Epic 2.4).

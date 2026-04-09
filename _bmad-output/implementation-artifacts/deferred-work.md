# Deferred work

## Deferred from: code review of 2-1-sqlite-database-drizzle-schema-and-migrations-for-todos.md (2026-04-09)

- Root CI workflow runs E2E only and does not run root `npm test` (which includes the api workspace and the new migration test). Native install still runs via `npm ci`, but migration/unit coverage is local-only until CI is extended (e.g. Epic 2.4).

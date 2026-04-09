# bmad-todo-app

Monorepo layout: `client/` (Vite + React + TypeScript), `api/` (Fastify).

**Use Node.js 20 or newer** for all packages in this repository.

## Workspace scripts

- `npm run dev` (from repo root) starts client and API together.
  - Client default dev URL: `http://localhost:5173`
  - API default dev URL: `http://localhost:3000` (or `PORT` if set)
- `npm run test` (from repo root) runs workspace unit tests with fail-fast behavior:
  - client tests run first
  - api tests run only if client tests pass

You can still run package scripts independently from `client/` and `api/` (for example `npm run dev` or `npm run test` in either package directory).

For SPA-to-API wiring in local development, use `VITE_API_BASE_URL` (explicit API URL), or switch to a Vite proxy later if preferred.

## E2E / Playwright

The `e2e/` workspace holds **Playwright** harness tests. Story 1.4 adds a **minimal smoke** spec only (no running todo app, API, or Docker).

**One-time browser binaries** (after `npm ci` or fresh clone):

```bash
npm exec playwright install
```

From the repo root, run the E2E suite:

```bash
npm run test:e2e
```

Full **user journeys** (create, complete, delete, errors, etc.) are planned for **Epic 3**; this folder is the scaffold so CI can prove the runner works first.

## Environment variables

Root [`.env.example`](.env.example) lists placeholders for both packages. **Vite loads env files from `client/`** and the **API loads them from `api/`**, so copy the relevant lines into `client/.env` and `api/.env` when you run package-level dev servers; keep values in sync with the root file when using `npm run dev` from the repo root.

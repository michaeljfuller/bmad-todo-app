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

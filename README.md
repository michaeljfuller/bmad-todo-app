# bmad-todo-app

Monorepo: **`client/`** (Vite + React + TypeScript), **`api/`** (Fastify), **`e2e/`** (Playwright). Root **`package.json`** uses **npm workspaces**.

For deeper technical boundaries, see [`_bmad-output/planning-artifacts/architecture.md`](_bmad-output/planning-artifacts/architecture.md).

## Prerequisites

- **Node.js ≥ 20** (see `engines` in root, `client/`, `api/`, and `e2e/` `package.json` files). Check with:

  ```bash
  node -v
  ```

- **npm** (this repo is wired for **npm workspaces** and a committed **`package-lock.json`**). You can use **pnpm** or **yarn** only if you translate install/workspace commands yourself; the documented path is **npm**.

## Quick start / Bootstrap

From the **repository root** after clone:

```bash
npm run bootstrap
```

This **idempotently**:

1. Runs **`npm install`** at the root (safe to repeat; refreshes workspace links).
2. Copies **[`client/.env.example`](client/.env.example)** → **`client/.env`** and **[`api/.env.example`](api/.env.example)** → **`api/.env`** **only if those files do not exist** (re-runs will not overwrite your local env).
3. Runs **`playwright install`** for the **`e2e`** workspace via **`npm exec --workspace=e2e -- playwright install`** (safe to repeat; refreshes browser binaries).

**Manual equivalent** (if you prefer not to use the script):

```bash
npm install
cp client/.env.example client/.env
cp api/.env.example api/.env
npm exec --workspace=e2e -- playwright install
```

On Windows without `cp`, copy each package’s **`.env.example`** next to **`.env`** in the same folder, then run **`npm exec --workspace=e2e -- playwright install`**. Prefer **`npm run bootstrap`** from the repo root for the full sequence (install, env copy, Playwright). **`node scripts/bootstrap.mjs`** only copies env files—use it after **`npm install`** if you already have dependencies and only need **`.env`** files.

## Development

Start **client and API together** from the repo root:

```bash
npm run dev
```

- **Client (Vite):** default **http://localhost:5173**
- **API (Fastify):** default **http://localhost:3000** (override with **`PORT`** in **`api/.env`**)

There is **no Vite dev-server proxy** in the current scaffold; point the SPA at the API with **`VITE_API_BASE_URL`** in **`client/.env`** (see [`client/.env.example`](client/.env.example)).

## Testing

**Unit tests** (client Vitest + API Node test runner), from repo root:

```bash
npm run test
# same as:
npm run test:unit
```

Workspace equivalents: `npm run test --workspace client`, `npm run test --workspace api`.

**E2E (Playwright)**, from repo root (requires browsers — run **`npm run bootstrap`** once or install manually):

```bash
npm run test:e2e
```

Playwright starts **`npm run dev:e2e-stack`** (see [`scripts/e2e-dev-stack.sh`](scripts/e2e-dev-stack.sh)): it migrates SQLite, runs the **API** on **3000**, builds the **client** with **`VITE_API_BASE_URL=http://127.0.0.1:3000`**, then serves **`vite preview`** on **5199** (not 5173) so tests do not collide with **`npm run dev`**. **`CORS_ORIGIN`** for that stack defaults to **`http://127.0.0.1:5199`**. CI sets **`DATABASE_PATH`** to a temp file for the E2E job (see [`.github/workflows/ci.yml`](.github/workflows/ci.yml)).

CI installs browsers with **`npm exec --workspace=e2e -- playwright install --with-deps`**; locally, **`playwright install`** is usually enough.

## Build

**Client production build** (from repo root):

```bash
npm run build --workspace client
```

## Project layout

| Path        | Role                                      |
| ----------- | ----------------------------------------- |
| `client/`   | Vite + React SPA, Vitest; `.env.example` for `VITE_*` |
| `api/`      | Fastify API (fastify-cli); `.env.example` for server env |
| `e2e/`      | Playwright config and specs               |
| `scripts/`  | Root automation (e.g. `bootstrap.mjs`)    |

## Troubleshooting

| Issue | What to do |
| ----- | ---------- |
| **Wrong Node version** | Need **≥ 20**. Use [nvm](https://github.com/nvm-sh/nvm) or [fnm](https://github.com/Schniz/fnm) to install/switch, then reinstall deps. |
| **Playwright / browser errors** | From root: `npm exec --workspace=e2e -- playwright install`. On Linux CI-style hosts, try `playwright install --with-deps` (see workflow above). Re-running install is safe. |
| **Missing `.env` / API or client misconfigured** | Ensure **`client/.env`** and **`api/.env`** exist (run **`npm run bootstrap`** or copy from [`client/.env.example`](client/.env.example) and [`api/.env.example`](api/.env.example)). Client: **`VITE_API_BASE_URL`**. API: **`PORT`**, **`DATABASE_PATH`**, **`CORS_ORIGIN`**, **`LOG_LEVEL`**, **`NODE_ENV`**. |
| **Port already in use** | Change **`PORT`** in **`api/.env`** and align **`VITE_API_BASE_URL`** in **`client/.env`**, or stop the process using **5173** / **3000**. |

## Out of scope (Epic 1)

The following are **not** part of closing **Epic 1** in this repository; they are planned in later epics and will get their own docs/workflows:

- **Docker**, multi-stage images, and **Docker Compose** stacks → **Epic 4** (see `_bmad-output/planning-artifacts/epics.md`).
- **API HTTP integration tests** under **`api/test/integration/`** (real HTTP against an isolated DB) → **Epic 2** and related stories.

Do not expect README steps for **`docker compose`** or **`api/test/integration/`** until those epics land.

## CI

Continuous integration runs from [`.github/workflows/`](.github/workflows/) (currently **E2E** with **`npm ci`**, Playwright browser install, and **`npm run test:e2e`**). Reproduce locally with the **Bootstrap** and **Testing** sections above.

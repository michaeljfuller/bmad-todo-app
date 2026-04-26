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

Playwright starts **`npm run dev:e2e-stack`** (see [`scripts/e2e-dev-stack.sh`](scripts/e2e-dev-stack.sh)): it migrates SQLite, runs the **API** on **3000**, builds the **client** with **`VITE_API_BASE_URL=http://127.0.0.1:3000`**, then serves **`vite preview`** on **5199** (not 5173) so tests do not collide with **`npm run dev`**. **`CORS_ORIGIN`** for that stack defaults to **`http://127.0.0.1:5199`**. Unless you override it, **`DATABASE_PATH`** defaults to a **gitignored** file under **`.tmp/`** in the repo root so product E2E does not reuse your dev **`api/data/todos.db`**. CI sets **`DATABASE_PATH`** to a temp file for the E2E job (see [`.github/workflows/ci.yml`](.github/workflows/ci.yml)).

CI installs browsers with **`npm exec --workspace=e2e -- playwright install --with-deps`**; locally, **`playwright install`** is usually enough.

**Product E2E checklist (Story 3.7):** one command **`npm run test:e2e`** from the root; client at **`http://127.0.0.1:5199`**, API at **`http://127.0.0.1:3000`** (override API port with **`E2E_API_PORT`** when starting the stack and set **`E2E_API_BASE_URL`** for Playwright `request` helpers if you change the port). The HTML artifact [`_bmad-output/planning-artifacts/ux-design-directions.html`](_bmad-output/planning-artifacts/ux-design-directions.html) is **reference-only** for humans and is **not** imported or bundled into the app.

### Manual checks (keyboard & reduced motion, Story 3.6)

Automated coverage lives in **`e2e/tests/keyboard-flows.spec.ts`**. For QA without Playwright, use a **320px-wide** (or narrow phone) viewport and verify:

1. **No horizontal scroll** on the main column while scanning the list, toggling completion, deleting, and adding a todo; long task text wraps instead of forcing overflow.
2. **Tab order:** **Todo app** title → first row **checkbox** → that row **Delete** → repeat for additional rows → **New task** field → **Add** button (Shift+Tab reverses). If the list is in **error** state (banner with **Retry**), order is **title** → **Retry** → **New task** → **Add** (no row checkboxes until the error is cleared).
3. **Space** with focus on a row checkbox toggles complete / active without using the mouse.
4. **Enter** with focus in **New task** submits the form (same as **Add**) when the text is non-empty.
5. **Focus ring:** Tab through controls and confirm a **high-contrast** visible ring on buttons, the text field, and checkboxes (not mouse-only `:focus` styling).
6. **Reduced motion:** Enable the OS/browser **reduce motion** setting (e.g. macOS **Accessibility → Display → Reduce motion**), reload the app, open the todo list loading state if possible, and confirm **skeleton placeholders do not pulse** (static or faded blocks only).

## Build

**Client production build** (from repo root):

```bash
npm run build --workspace client
```

## Build container images

Build from the **repository root** so `package-lock.json` and npm workspaces resolve correctly. Dockerfiles are multi-stage; **API** and **web** final stages run as **non-root**. Story **4.3** adds root **`docker compose`** wiring (healthchecks, SQLite volume)—this section is **image build + run** only.

### API image

```bash
docker build -f docker/api.Dockerfile -t bmad-todo-api:local .
```

**Run (smoke)** — set a **writable** SQLite path the non-root user can create (defaults in [`api/.env.example`](api/.env.example) use `./data/todos.db` relative to the API package; in the image, **`/data/todos.db`** is typical):

```bash
docker run --rm \
  -e DATABASE_PATH=/data/todos.db \
  -e CORS_ORIGIN=http://127.0.0.1:8080 \
  -p 3000:3000 \
  bmad-todo-api:local
```

Migrations are **not** run automatically in the image `CMD`; run once when deploying, e.g. `docker run --rm ... bmad-todo-api:local npm run db:migrate --workspace=api` with the same env/volume as the long-running container (see [`api/package.json`](api/package.json) `db:migrate`).

The image includes a **`HEALTHCHECK`** that **GET**s `http://127.0.0.1:${PORT:-3000}/health` (requires **`curl`** in the image).

### Web image (Vite build args)

**`VITE_API_BASE_URL`** is applied at **Vite build time** (same semantics as [`client/.env.example`](client/.env.example)): the browser-visible API origin **without** a path suffix; the client calls `GET {VITE_API_BASE_URL}/todos`.

```bash
docker build -f docker/web.Dockerfile \
  --build-arg VITE_API_BASE_URL=http://127.0.0.1:3000 \
  -t bmad-todo-web:local .
```

Use a value the **user’s browser** can reach (e.g. `http://localhost:3000` when the API is published on localhost, or your eventual public API URL behind a reverse proxy).

**Run (smoke)** — the static image listens on **8080** (nginx unprivileged):

```bash
docker run --rm -p 8080:8080 bmad-todo-web:local
```

Then open `http://127.0.0.1:8080/` — expect **200** and the SPA shell (`index.html` plus hashed assets under `/assets/`).

### Platforms

Images are built for the **daemon’s default platform** (e.g. **linux/arm64** on Apple Silicon, **linux/amd64** on typical Linux CI). To target CI explicitly: `docker buildx build --platform linux/amd64 -f docker/api.Dockerfile .` (and add **`linux/arm64`** to `--platform` when publishing multi-arch).

## Project layout

| Path        | Role                                      |
| ----------- | ----------------------------------------- |
| `client/`   | Vite + React SPA, Vitest; `.env.example` for `VITE_*` |
| `api/`      | Fastify API (fastify-cli); `.env.example` for server env |
| `e2e/`      | Playwright config and specs               |
| `scripts/`  | Root automation (e.g. `bootstrap.mjs`)    |
| `docker/`   | Production **`*.Dockerfile`** and nginx config for the static SPA |

## Troubleshooting

| Issue | What to do |
| ----- | ---------- |
| **Wrong Node version** | Need **≥ 20**. Use [nvm](https://github.com/nvm-sh/nvm) or [fnm](https://github.com/Schniz/fnm) to install/switch, then reinstall deps. |
| **Playwright / browser errors** | From root: `npm exec --workspace=e2e -- playwright install`. On Linux CI-style hosts, try `playwright install --with-deps` (see workflow above). Re-running install is safe. |
| **Missing `.env` / API or client misconfigured** | Ensure **`client/.env`** and **`api/.env`** exist (run **`npm run bootstrap`** or copy from [`client/.env.example`](client/.env.example) and [`api/.env.example`](api/.env.example)). Client: **`VITE_API_BASE_URL`**. API: **`PORT`**, **`DATABASE_PATH`**, **`CORS_ORIGIN`**, **`LOG_LEVEL`**, **`NODE_ENV`**. |
| **Port already in use** | Change **`PORT`** in **`api/.env`** and align **`VITE_API_BASE_URL`** in **`client/.env`**, or stop the process using **5173** / **3000**. |

## Out of scope (Epic 1)

The following were **not** part of closing **Epic 1**; some have landed in later epics:

- **Multi-stage Docker images** for API + static web → **`docker/*.Dockerfile`** and the **Build container images** section above (**Epic 4**, Story 4.2).
- **Root `docker compose`** stack (healthchecks, SQLite volume, service wiring) → **Story 4.3** (README will gain compose steps there).

**API HTTP integration tests** under **`api/test/integration/`** are part of **Epic 2** (already in-repo); see **Testing** above for how to run them via the API workspace.

## CI

Continuous integration runs from [`.github/workflows/`](.github/workflows/) (currently **E2E** with **`npm ci`**, Playwright browser install, and **`npm run test:e2e`**). Reproduce locally with the **Bootstrap** and **Testing** sections above.

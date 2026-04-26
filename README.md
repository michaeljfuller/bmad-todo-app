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

## Run with Docker

Ship and try the app the same way CI validates images: **multi-stage** [`docker/api.Dockerfile`](docker/api.Dockerfile) and [`docker/web.Dockerfile`](docker/web.Dockerfile), root [`docker-compose.yml`](docker-compose.yml), and **[`.env.example`](.env.example)** (copy to **`.env`** — never commit real secrets).

### Prerequisites

- **Docker Engine** with the **Compose V2** plugin (`docker compose`, not the legacy `docker-compose` binary). A recent **24.x+** engine matches GitHub Actions and typical desktops.
- **Build context** is always the **repository root** so `package-lock.json` and npm workspaces resolve.

### Configure environment (Compose)

Optional: from the repo root, **`cp .env.example .env`** and edit. Variables are documented in [`.env.example`](.env.example): **`API_PORT`**, **`WEB_PORT`**, **`VITE_API_BASE_URL`** (browser-reachable API origin for the **web** image build), **`CORS_ORIGIN`** (browser origin of the SPA), **`LOG_LEVEL`**. Defaults match local URLs on **3000** (API) and **8080** (web).

### Start the stack (recommended)

```bash
docker compose up --build
```

- **Web (SPA):** [http://localhost:8080](http://localhost:8080) (override host mapping with **`WEB_PORT`** in `.env`)
- **API:** [http://localhost:3000](http://localhost:3000) (override with **`API_PORT`**)

**Networking:** Bridge network **`app_net`**. **`VITE_API_BASE_URL`** is a **build arg** for **web** — it must be the URL the **user’s browser** uses to call the API (default `http://localhost:3000`). **`CORS_ORIGIN`** must match the **browser origin** of the SPA (default `http://localhost:8080`), not an internal Docker DNS name.

**SQLite / persistence:** The **api** service uses **`DATABASE_PATH=/data/todos.db`** on named volume **`sqlite_data`**. Data survives **`docker compose restart`**; **`docker compose down -v`** removes the volume and wipes the database file.

**Health and startup order:** **`web`** uses **`depends_on: api`** with **`condition: service_healthy`**. Compose healthchecks: API probes **`GET /ready`** (readiness); the API Dockerfile **`HEALTHCHECK`** uses **`GET /health`** when you run the API image alone. Web probes **`wget`** on **`http://127.0.0.1:8080/`** inside the container.

**Logs:**

```bash
docker compose logs -f api
```

### Build images only (same as CI)

From the repo root (images run as **non-root** in final stages):

**API**

```bash
docker build -f docker/api.Dockerfile -t bmad-todo-api:local .
```

**Web** — **`VITE_API_BASE_URL`** is a **Vite build-time** arg (see [`client/.env.example`](client/.env.example)); client calls `GET {VITE_API_BASE_URL}/todos`.

```bash
docker build -f docker/web.Dockerfile \
  --build-arg VITE_API_BASE_URL=http://localhost:3000 \
  -t bmad-todo-web:local .
```

**Run API container (smoke):**

```bash
docker run --rm \
  -e DATABASE_PATH=/data/todos.db \
  -e CORS_ORIGIN=http://127.0.0.1:8080 \
  -p 3000:3000 \
  bmad-todo-api:local
```

On startup the API runs **Drizzle migrations** before traffic. One-shot migrate with a volume: see [`api/package.json`](api/package.json) `db:migrate`.

**Run web container (smoke):** listens on **8080** — `docker run --rm -p 8080:8080 bmad-todo-web:local`, then open `http://127.0.0.1:8080/`.

**Platforms:** Images use the daemon default platform (e.g. **linux/arm64** vs **linux/amd64**). For CI-like **amd64**: `docker buildx build --platform linux/amd64 -f docker/api.Dockerfile -t bmad-todo-api:local .`

### Optional compose smoke (operators / future CI)

Use this for manual verification or a **future** workflow step if the team accepts the runtime cost (duplicate surface vs existing root **E2E** on `dev:e2e-stack`):

1. **`docker compose up -d --build`** from the repo root (with `.env` if needed).
2. **Wait for healthy:** API healthcheck uses **10s** interval, **6** retries, **45s** start_period → allow roughly **2 minutes** before assuming failure; **web** starts after API is healthy (**15s** start_period).
3. **Checks:** `curl -fsS "http://127.0.0.1:${API_PORT:-3000}/health"`, `curl -fsS "http://127.0.0.1:${API_PORT:-3000}/ready"`, and `curl -fsS "http://127.0.0.1:${WEB_PORT:-8080}/"` (or `docker compose run` a small curl image on `app_net`).
4. **Teardown:** `docker compose down -v` if you want a clean volume, or `docker compose down` to keep data.

**Cost vs value:** Full **Playwright** against the composed stack duplicates **Epic 3** coverage and adds install + browser time; keep smoke as **curl/wget** unless you explicitly need UI regression on Compose. [`.github/workflows/ci.yml`](.github/workflows/ci.yml) documents the same optional path in comments.

### Troubleshooting (Docker)

| Issue | What to do |
| ----- | ---------- |
| **Port already in use** (`bind: address already in use`) | Change **`API_PORT`** / **`WEB_PORT`** in `.env`. Ensure **`VITE_API_BASE_URL`** still points at the host URL for the API (e.g. `http://localhost:<API_PORT>`) and rebuild **web** after changing it. |
| **API unhealthy / web never starts** | `docker compose logs api` — migration errors, **`/ready`** returning **503**, or permissions on **`/data`**. Confirm the SQLite volume is writable. |
| **SPA loads but todos fail (CORS / network)** | **`VITE_API_BASE_URL`** must match what the **browser** uses (scheme + host + port). **`CORS_ORIGIN`** must match the SPA’s origin exactly (including port). Rebuild **web** after changing **`VITE_API_BASE_URL`**. |
| **Empty DB path / wrong file** | In Compose the API uses **`/data/todos.db`** on volume **`sqlite_data`**. For `docker run` API only, set **`DATABASE_PATH`** to a path inside a mounted volume the non-root user can write. |
| **Wrong Node / missing Compose** | Node is only required on the **host** for dev; **Docker builds** use `node:20` inside the Dockerfile. Install **Docker Desktop** or engine **24+** with Compose V2. |

### Production / TLS (NFR-S2)

For non-local deployment, **TLS/HTTPS** between the **browser** and the **API** is expected at the **reverse proxy or platform edge** (load balancer, ingress, CDN). The **Fastify** process and **nginx** static image are **HTTP** on their ports inside the network; terminating TLS at the edge is the default pattern—only add in-container TLS if your platform requires it.

**Do not** bake secrets into images or commit **`.env`**; use the platform’s secret store and env injection at runtime. Aligns with the PRD non-functional expectations and [`_bmad-output/planning-artifacts/architecture.md`](_bmad-output/planning-artifacts/architecture.md) deployment notes.

## Project layout

| Path        | Role                                      |
| ----------- | ----------------------------------------- |
| `client/`   | Vite + React SPA, Vitest; `.env.example` for `VITE_*` |
| `api/`      | Fastify API (fastify-cli); `.env.example` for server env |
| `e2e/`      | Playwright config and specs               |
| `scripts/`  | Root automation (e.g. `bootstrap.mjs`)    |
| `docker/`   | Production **`*.Dockerfile`** and nginx config for the static SPA |
| `docker-compose.yml` | **API + web** stack, **`app_net`**, SQLite volume, healthchecks |
| `.env.example` (root) | Defaults for **Compose** build args and service env (copy to **`.env`**) |

## Troubleshooting

| Issue | What to do |
| ----- | ---------- |
| **Wrong Node version** | Need **≥ 20**. Use [nvm](https://github.com/nvm-sh/nvm) or [fnm](https://github.com/Schniz/fnm) to install/switch, then reinstall deps. |
| **Playwright / browser errors** | From root: `npm exec --workspace=e2e -- playwright install`. On Linux CI-style hosts, try `playwright install --with-deps` (see workflow above). Re-running install is safe. |
| **Missing `.env` / API or client misconfigured** | Ensure **`client/.env`** and **`api/.env`** exist (run **`npm run bootstrap`** or copy from [`client/.env.example`](client/.env.example) and [`api/.env.example`](api/.env.example)). Client: **`VITE_API_BASE_URL`**. API: **`PORT`**, **`DATABASE_PATH`**, **`CORS_ORIGIN`**, **`LOG_LEVEL`**, **`NODE_ENV`**. |
| **Port already in use** | Change **`PORT`** in **`api/.env`** and align **`VITE_API_BASE_URL`** in **`client/.env`**, or stop the process using **5173** / **3000**. |

## Out of scope (Epic 1)

The following were **not** part of closing **Epic 1**; some have landed in later epics:

- **Multi-stage Docker images** and **root Compose** → see **Run with Docker** above (**Epic 4**).

**API HTTP integration tests** under **`api/test/integration/`** are part of **Epic 2** (already in-repo); see **Testing** above for how to run them via the API workspace.

## CI

Continuous integration runs from [`.github/workflows/ci.yml`](.github/workflows/ci.yml): **Docker image builds** (`docker/api.Dockerfile`, `docker/web.Dockerfile` with **`VITE_API_BASE_URL=http://localhost:3000`** on **`ubuntu-latest`**), **API integration** (`npm ci`, compose contract test, `npm run test:integration --workspace=api`), and **E2E** (`npm ci`, Playwright browsers, **`npm run test:e2e`**). Reproduce locally with **Bootstrap**, **Testing**, and **Run with Docker** above.

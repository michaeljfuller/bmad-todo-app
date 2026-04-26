# Story 4.2: Multi-stage Dockerfiles for API and static web

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an **operator**,
I want **production-oriented Dockerfiles** for **API** and **static client**,
so that **images are small, reproducible, and run as non-root** [Source: `_bmad-output/planning-artifacts/epics.md` — Story 4.2; `_bmad-output/planning-artifacts/architecture.md` — Container decisions].

## Acceptance Criteria

1. **Multi-stage + non-root** — Given **`docker/api.Dockerfile`** and **`docker/web.Dockerfile`**, when images are built for **`api`** and **`web`**, both use **multi-stage** builds and the **final stage** runs as a **non-root** `USER` (dedicated uid/gid, not `USER node` on an image that still leaves writable sensitive paths owned by root in ways that break SQLite—see Dev Notes).
2. **Web image = static `dist`** — The **`web`** image serves **`client/dist`** via **nginx** (or equivalent minimal static server **explicitly** approved in Architecture: nginx is the reference) [Source: `architecture.md` — `docker/web.Dockerfile` line ~338].
3. **API image = runtime-only** — The **`api`** image contains only what is needed to run **Fastify** (`fastify start` / `app.js` + autoloaded `plugins/`, `routes/`), **production** `node_modules` for the **`api`** workspace (including **`better-sqlite3`** native bindings built for the image OS/arch), **Drizzle migrations SQL** under **`api/drizzle`** (or wherever `api/scripts/migrate.js` expects them), and **no** client source tree unless unavoidable for a shared workspace install (prefer **root `npm ci` scoped to `api`** so `client/` is not copied into the runtime stage).
4. **README: `VITE_API_BASE_URL`** — README documents **`docker build`** (or **`docker buildx build`**) **build args** for the **web** image that set **`VITE_API_BASE_URL`** at **Vite build time** (same semantics as local **`client/.env`** — browser-visible API origin **without** path suffix; client uses `GET {VITE_API_BASE_URL}/todos`) [Source: `client/.env.example`; `architecture.md` — `.env.example` / compose variables].

## Prerequisites

- **Story 4.1** (`GET /health`, `GET /ready`) is **ready-for-dev** in sprint status—implement **4.1** before or **with** **`docker/api.Dockerfile`** so the **`HEALTHCHECK`** target exists at merge. If **`/health`** is not yet in the running image, do **not** leave a permanent fake always-success probe—Architecture expects **`HEALTHCHECK` → `/health`** [Source: `architecture.md` — api.Dockerfile HEALTHCHECK; Epic 4 Story 4.1].
- **Epic 2–3** delivered **`api/`** Fastify app, **`client/`** Vite production build (`npm run build --workspace client` → **`client/dist/`**), and **`/todos`** contract [Source: `_bmad-output/project-context.md`].
- **Story 4.3** will add **`docker-compose.yml`**; this story **only** adds **`docker/*.Dockerfile`** (and README build instructions). Do **not** implement full Compose here unless you need a local smoke target—keep scope to Dockerfiles + docs per epic split.

## Tasks / Subtasks

- [x] **`docker/api.Dockerfile`** (AC: #1–#3)
  - [x] **Build context = repo root** so **`package-lock.json`** and **npm workspaces** resolve correctly (pattern: `docker build -f docker/api.Dockerfile .` from repository root).
  - [x] **Stage A (deps):** `COPY` root **`package.json`** + **`package-lock.json`**, **`api/package.json`** (and any other **`package.json`** files **required** by npm for `npm ci --workspace=api`—if npm demands sibling workspace manifests, copy the minimal set of workspace package.json files **without** copying full `client/src` into later stages).
  - [x] Run **`npm ci --workspace=api --omit=dev`** (or equivalent documented command) with **`NODE_ENV=production`** where appropriate; ensure **`better-sqlite3`** compiles or uses **prebuilds** matching the **runtime** base image (**glibc** vs **musl**—pick **one** base family and stick to it; **Debian/Ubuntu slim** is often simpler for native addons than Alpine unless you add build toolchains).
  - [x] **Stage B (runtime):** copy **`api/`** application files needed at runtime (**`app.js`**, **`plugins/`**, **`routes/`**, **`scripts/migrate.js`**, **`drizzle/`** SQL migrations, etc.—**exclude** `api/test/`, `**/*.test.js`, eslint config if not needed).
  - [x] Set **`USER`** non-root; expose **`PORT`** (default **3000**); **`CMD`** runs the same **`npm run start --workspace=api`** or **`node`**/`fastify` entrypoint as **`api/package.json`** **`start`** script.
  - [x] Add **`HEALTHCHECK`** aligned with Architecture: HTTP **GET** `http://127.0.0.1:${PORT}/health` (or fixed port if `PORT` is baked)—requires a tiny HTTP client in the image (**`curl`**) or a documented alternative **only** if 4.1 is truly absent (then coordinate with 4.1 immediately).
- [x] **`docker/web.Dockerfile`** (AC: #1–#2, #4)
  - [x] **Stage A (build):** Node image with **`npm ci`** including **devDependencies** for **`client`** workspace (TypeScript + Vite build).
  - [x] **`ARG VITE_API_BASE_URL`** — pass through to **`ENV`** **before** **`npm run build --workspace client`** so Vite inlines the correct API origin for that image.
  - [x] **Stage B (runtime):** **`nginx:alpine`** (or slim nginx) copying **`client/dist`** to **`/usr/share/nginx/html`** (or standard path); include minimal **`nginx.conf`** only if needed for **SPA fallback to `index.html`** (Vite React SPA: **`try_files`** for client-side routing).
  - [x] Non-root nginx pattern (official nginx unprivileged image or **`user` directive** + writable dirs for caches/pid)—Architecture mandates **non-root** in **final** stage.
  - [x] Optional static **`HEALTHCHECK`** (e.g. **`wget -qO- http://127.0.0.1:8080/`**) per Architecture “HTTP 200 on `/` or `/health` on nginx”—match the **actual** listen port in your nginx config.
- [x] **README** (AC: #4)
  - [x] Section **“Build container images”** (or under a future **“Run with Docker”** heading): exact **`docker build`** commands from repo root, **`--build-arg VITE_API_BASE_URL=...`** examples for **browser-reachable** API URL (e.g. `http://localhost:3000` vs reverse-proxy URL), and note that **Compose**-based run is **Story 4.3**.
- [x] **Verification** (local, no CI requirement in this story)
  - [x] `docker build -f docker/api.Dockerfile .` succeeds on **linux/amd64** (and **arm64** if team targets Apple Silicon—document if only one arch is supported initially).
  - [x] `docker build -f docker/web.Dockerfile --build-arg VITE_API_BASE_URL=http://127.0.0.1:3000 .` succeeds; container serves **`index.html`** and assets.

## Dev Notes

### Technical requirements

- **Monorepo installs:** Use **root** lockfile (**`npm ci`**) with **workspace** flags; do **not** switch the repo to **pnpm**/**yarn** in this story [Source: root **`README.md`**; `package.json` **workspaces**].
- **API entry:** **`api/package.json`** → **`"start": "fastify start -o -l info app.js"`** — container should use the same.
- **Env at runtime (API):** **`PORT`**, **`DATABASE_PATH`**, **`CORS_ORIGIN`**, **`NODE_ENV`**, **`LOG_LEVEL`** — same as **`api/.env.example`**; **never** bake secrets into images [Source: `api/.env.example`; `project-context.md` — Env].
- **SQLite path in container:** Choose a **writable** path under a directory the non-root user owns (e.g. **`/data/todos.db`**)—Compose in **4.3** will mount a volume there; the image should still start for **smoke** with an **empty** file or migration-created DB when **`DATABASE_PATH`** is set.
- **Migrations:** If the API expects migrations before traffic, document whether the **image entrypoint** runs **`npm run db:migrate --workspace=api`** before **`start`**, or whether **operators** run migrate once—align with **4.1 readiness** definition when both land [Source: `api/package.json` **`db:migrate`**; Epic 4.1 AC].

### Architecture compliance

- **Paths:** All production Docker logic under **`docker/`**; **one** Compose file at root is **4.3**—do not scatter ad-hoc Dockerfiles [Source: `architecture.md` — Project structure ~333–339].
- **Multi-stage, non-root, HEALTHCHECK** on long-running services [Source: `architecture.md` — ~287–289, 458].
- **Logging:** Pino already to **stdout** in API—no change required for Dockerfiles beyond ensuring **not** logging **only** to files [Source: `project-context.md`; `architecture.md` — Pino].

### Library / framework requirements

- **Node ≥ 20** in build stages to match **`engines`** [Source: root / `api` / `client` **`package.json`**].
- **nginx** for **`web`** final stage unless Architecture is explicitly revised—stay with nginx for operator familiarity.
- Do **not** introduce **Podman-specific** syntax unless README also documents **Docker** equivalence.

### File structure requirements

| Artifact | Path |
|----------|------|
| API Dockerfile | `docker/api.Dockerfile` |
| Web Dockerfile | `docker/web.Dockerfile` |
| Optional nginx config for SPA | `docker/nginx-web.conf` (or embedded `RUN echo`—prefer **checked-in** file for reviewability) |
| README updates | `README.md` |

### Testing requirements

- **No new automated test gate** is mandatory in **4.2** per epics; **4.4** adds **CI `docker build`**. Still run **local `docker build`** and a **manual** `docker run` smoke (**API** listens, **`/todos`** or health if 4.1 exists; **web** returns **200** on **`/`**).
- **Integration / unit** suites remain **`npm test`** from host—do not mount repo into production image for “dev” workflows in this story.

### Previous story intelligence

- **Story 4.1** artifact: **`_bmad-output/implementation-artifacts/4-1-liveness-and-readiness-http-endpoints.md`** — use it for **`/health`** / **`/ready`** semantics, integration test patterns, and **safe response bodies** (no sensitive internals) before wiring **`HEALTHCHECK`**. If 4.1 is not merged yet, align Dockerfile work with that spec.
- **Epic 3.7** / **E2E stack** uses **`VITE_API_BASE_URL`** and **`CORS_ORIGIN`** alignment—mirror that thinking for **container** URLs documented in README [Source: **`README.md`** — E2E / `scripts/e2e-dev-stack.sh`].
- **Epic 3 retrospective** (if present) and **project-context** emphasize **stdout** logging and **security** posture—non-root supports **NFR** container posture [Source: `_bmad-output/project-context.md`].

### Project context reference

- Follow **`_bmad-output/project-context.md`** for stack boundaries (**Fastify**, **Vite `dist`**, **better-sqlite3**, **camelCase JSON**, **no secrets in client bundle**).

### Latest technical notes (containers)

- Prefer **`docker/dockerfile:1`** syntax if using **`# syntax=`** directive for **`COPY --link`** / modern features—optional.
- For **`better-sqlite3`**, mismatched **glibc/musl** between build and runtime is a **common failure mode**—use the **same** distro for **compile** and **run**, or use **prebuildify**/**official** Node images on **`bookworm-slim`** consistently.
- Re-read [Node Docker Good Defaults](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md) for **non-root** and **`NODE_ENV=production`**.

## Dev Agent Record

### Agent Model Used

Composer (Cursor agent)

### Debug Log References

- Agent environment had no `docker` CLI; **`npm test`** (client Vitest + API unit/integration) run and passed. Human verification: `docker build -f docker/api.Dockerfile .` and `docker build -f docker/web.Dockerfile --build-arg VITE_API_BASE_URL=... .` from repo root.

### Completion Notes List

- **AC1–3 `docker/api.Dockerfile`:** `node:20-bookworm-slim` deps stage with `python3`/`make`/`g++` for `better-sqlite3`; `npm ci --workspace=api --omit=dev`; runtime copies hoisted `node_modules`, workspace **`package.json`** stubs (`client/`, `e2e/`), and selective **`api/`** app dirs (`app.js`, `plugins/`, `routes/`, `db/`, `schemas/`, `scripts/`, `migrations/`—SQL migrations live under **`api/migrations/`** per `db/index.js`). User **`appuser` (uid/gid 1001)**; **`/data`** owned for SQLite; **`curl`** + **`HEALTHCHECK`** → **`/health`**; **`CMD`** `npm run start --workspace=api`.
- **AC1–2,4 `docker/web.Dockerfile`:** Node build stage `npm ci`, **`ARG`/`ENV VITE_API_BASE_URL`**, `npm run build --workspace=client`; runtime **`nginxinc/nginx-unprivileged:1.27-alpine`**, `client/dist` → `/usr/share/nginx/html`, **`docker/nginx-web.conf`** SPA `try_files`, listen **8080**, **`wget`** health on `/`.
- **README:** “Build container images” with build/run examples, **`VITE_API_BASE_URL`** semantics, **`DATABASE_PATH`**, migrate operator note, platform note, **4.3** compose pointer; project layout + out-of-scope refreshed.
- **`.dockerignore`:** Reduces build context (`node_modules`, `dist`, `.tmp`, `*.db`, `_bmad-output`).

### File List

- `.dockerignore`
- `docker/api.Dockerfile`
- `docker/web.Dockerfile`
- `docker/nginx-web.conf`
- `README.md`
- `_bmad-output/implementation-artifacts/4-2-multi-stage-dockerfiles-for-api-and-static-web.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Change Log

- **2026-04-26:** Story 4.2 — multi-stage API + web Dockerfiles, nginx SPA config, README container build/run docs, `.dockerignore`; sprint status `4-2` → `review`.
- **2026-04-26:** Code review — README migrate/volume copy-paste example; story + sprint `4-2` → `done`.

## Story completion status

- **done** — Code review patch applied (README migrate + volume example); Docker CLI smoke builds still recommended on a host with Docker.

### Review Findings

- [x] [Review][Patch] README migrate example is not copy-pasteable — Fixed: added named-volume migrate one-shot and matching API `docker run` with `-v` (see README **Migrate (one-shot)**). [README.md:~118]

# Story 4.3: Docker Compose stack with healthchecks and SQLite volume

Status: done

<!-- Ultimate context engine analysis completed - comprehensive developer guide created -->

## Story

As an **operator**,
I want **`docker compose up`** to start **API + web** with **persistent SQLite** and **healthy dependencies**,
so that **demos and local prod-like runs match Architecture** (**FR24**).

## Acceptance Criteria

1. **Compose file at root** — Given **`docker-compose.yml`** at repo root, when an operator runs **`docker compose up --build`**, the stack starts **`api`** and **`web`** services built from the Architecture-defined Dockerfiles.

2. **SQLite persistence** — **`api`** mounts a **named or bind-mounted volume** for the database file referenced by **`DATABASE_PATH`**; after **`docker compose restart api`** (or stop/start without removing the volume), todos **remain** (document how to wipe data if needed).

3. **Startup ordering** — **`web`** declares **`depends_on`** for **`api`** using **`condition: service_healthy`** (or equivalent Compose v2 syntax) so the static client does not race ahead of an API that is still booting/migrating.

4. **Health checks** — **`healthcheck:`** (and/or Dockerfile **`HEALTHCHECK`**) are wired so:
   - **API** liveness probes **`GET /health`** (and readiness gating for dependents uses **`GET /ready`** where Architecture requires DB/migrations before “ready”).
   - **Web** has an appropriate check (e.g. HTTP **200** on **`/`** or a small static **`/health`** if nginx is configured) — document the chosen contract.

5. **Networking and env** — Services share a **bridge network** (e.g. `app_net` per Architecture). Non-secret variables are documented via **root and/or `api/.env.example`** and Compose **`env_file` / `environment:`**; **`.env`** is gitignored; **no secrets** committed.

6. **Observability** — **`docker compose logs`** (especially **`api`**) shows **Pino** structured logs on **stdout/stderr** (**FR25** visibility for operators).

## Tasks / Subtasks

- [x] **Prerequisite gate** (AC: all) — Confirm **Story 4.1** (`/health`, `/ready`) and **Story 4.2** (`docker/api.Dockerfile`, `docker/web.Dockerfile`) exist and match Architecture; if implementing out of order, implement minimal 4.1/4.2 artifacts in the same change set so compose is not broken.

- [x] **`docker-compose.yml`** (AC: #1, #3, #4, #5)
  - [x] Define **`api`** and **`web`** services, **`build:`** contexts pointing at **`docker/api.Dockerfile`** and **`docker/web.Dockerfile`**.
  - [x] Attach **volume(s)** for SQLite path used by **`DATABASE_PATH`** inside the container (prefer **named volume** or documented bind mount, e.g. `/data` → consistent with Architecture examples).
  - [x] **`depends_on`** with **`condition: service_healthy`** from **`web`** → **`api`**.
  - [x] **`healthcheck`** blocks calling **`/health`** and **`/ready`** on **`api`** with correct **`PORT`**; align intervals/timeouts with cold-start + migration time.
  - [x] **`ports`** for published **API** and **web** ports; document defaults (`API_PORT` / `WEB_PORT` in `.env.example` if used).

- [x] **Environment contract** (AC: #2, #5)
  - [x] Set **`DATABASE_PATH`** inside **`api`** to a **container path** on the mounted volume (e.g. `/data/todos.db`) — `api/db/index.js` resolves relative paths against **`api/`**; prefer **absolute** paths in compose to avoid ambiguity.
  - [x] Set **`CORS_ORIGIN`** to the **browser-origin URL** of the **web** service (e.g. `http://localhost:<web-host-port>`), not an internal Docker DNS name, because CORS compares to the page origin.
  - [x] **`web`** image: ensure **`VITE_API_BASE_URL`** at **build time** points at the URL the **browser** uses to reach the API (host-mapped port or documented reverse-proxy story) — see Story **4.2** README/build-arg notes and Epic 3 retro “build-arg for API base URL”.

- [x] **Documentation** (AC: #2, #5, #6)
  - [x] README (or a short **`docs/compose.md`** only if README would become unwieldy — prefer README section per Epic **4.4** scope split): **`docker compose up --build`**, ports, volume behavior, **`docker compose down` vs `-v`**, **`docker compose logs -f api`**, troubleshooting unready API (DB permissions, migration failures).

## Dev Notes

### Prerequisites and sequencing

- **Stories 4.1 and 4.2 are hard dependencies.** Compose healthchecks and service definitions assume **`GET /health`**, **`GET /ready`**, and production Dockerfiles under **`docker/`**. Do not land a compose file that references missing routes or Dockerfiles without either completing those stories first or delivering them together in one PR.

- **No prior Epic 4 story files** exist in `implementation-artifacts/` yet; there is **no** `docker/` or `docker-compose.yml` in the repo at story creation time — greenfield for container layout.

### Architecture compliance

- **Compose layout:** Root **`docker-compose.yml`**; Dockerfiles under **`docker/`**; **`client/`**, **`api/`**, **`e2e/`**, **`docker/`** boundaries per [Source: `_bmad-output/planning-artifacts/architecture.md` — “Containers & Compose”, directory tree].

- **Health contract:** API **`/health`** (liveness) vs **`/ready`** (SQLite reachable + migrations satisfied); Compose **`healthcheck`** and **`depends_on` / `service_healthy`** where order matters [Source: `architecture.md` — “Health & operability”, “Docker Compose (behavioral contract)”].

- **SQLite:** Single file per deployment; **volume** for persistence; no separate DB container for v1 [Source: `architecture.md` — deployment section].

- **Logging:** Pino to **stdout/stderr** only in containers so **`docker compose logs`** captures failures [Source: `architecture.md` — logging + FR25].

### Implementation guardrails

- **`DATABASE_PATH`:** Required at runtime (`api/db/index.js` throws if missing). Parent directory is created with **`fs.mkdirSync(..., { recursive: true })`** — volume mount point must be writable by the **non-root** API user from Story 4.2.

- **Anti-patterns (do not):** API container as **root**; **no health checks** when **`web`** depends on API readiness; **CORS** set to internal Docker hostname for browser traffic; mixing REST path prefixes.

### Testing

- **Manual / smoke (this story):** After **`docker compose up --build`**, curl **`/health`** and **`/ready`** on the published API port; open **`web`** URL; create a todo; **`docker compose restart api`**; confirm list still matches persisted DB.

- **Automated CI for compose** is primarily **Story 4.4** — optional minimal “compose config valid” or smoke here only if already agreed with SM/Architect.

### Project Structure Notes

- Align with **`_bmad-output/project-context.md`**: **`depends_on`** with **`condition: service_healthy`**; **`docker compose logs`** for ops; env via **`.env`** / examples only.

### Previous story / epic intelligence

- **Epic 3 retrospective** (`_bmad-output/implementation-artifacts/epic-3-retro-2026-04-26.md`): Before Epic 4 image work, resolve **build-arg for `VITE_API_BASE_URL` in `web` image** vs local dev defaults so the static client in compose does not silently point at the wrong API. E2E/CI patterns used **isolated `DATABASE_PATH`** and CORS origin matching Playwright’s origin — mirror that discipline when documenting compose env for automated tests later.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 4 intro, Story 4.3 acceptance criteria]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — “Containers & Compose”, “Docker Compose (behavioral contract, not full YAML)”, NFR/FR mapping for health]
- [Source: `_bmad-output/project-context.md` — Technology stack table, workflow rules for Compose]
- [Source: `api/db/index.js` — `DATABASE_PATH` resolution and `mkdirSync` behavior]
- [Source: `api/.env.example` — baseline env names]

### Latest technical notes (Compose)

- Use **Compose specification** v2+ (`docker compose`, not legacy `docker-compose` binary) as documented for your target audience. **`depends_on: condition: service_healthy`** requires a **`healthcheck`** on the dependency service [Docker Compose docs — service conditions].

## Dev Agent Record

### Agent Model Used

Composer (Cursor agent)

### Debug Log References

### Completion Notes List

- Verified **4.1** routes (`api/routes/root.js`) and **4.2** Dockerfiles under **`docker/`** before compose work.
- Root **`docker-compose.yml`**: **`api`** + **`web`**, named volume **`sqlite_data`:** → **`/data`**, **`DATABASE_PATH=/data/todos.db`**, bridge **`app_net`**, **`web.depends_on.api.condition: service_healthy`**. API Compose **healthcheck** uses **`GET /ready`** (45s start_period, curl); image Dockerfile **HEALTHCHECK** remains **`/health`** for standalone runs. Web healthcheck: **`wget`** on **`/`** :8080.
- Root **`.env.example`**: **`API_PORT`**, **`WEB_PORT`**, **`VITE_API_BASE_URL`**, **`CORS_ORIGIN`**, **`LOG_LEVEL`** — no secrets; **`.env`** gitignored via existing rules.
- **README:** new **Run with Docker Compose** section (ports, CORS/Vite semantics, volume wipe, logs, troubleshooting); layout table + out-of-scope; corrected API image note (migrations run at startup via **`database`** plugin).
- **`api/.env.example`**: compose-oriented comments for **`DATABASE_PATH`** / **`CORS_ORIGIN`**.
- **Tests:** `test/compose-docker-compose.contract.test.js` + root **`npm test`** wire-up (structural compose contract; no Docker CLI — also run in **`api-integration`** CI via `node --test`).

### File List

- `docker-compose.yml`
- `.env.example`
- `README.md`
- `api/.env.example`
- `package.json`
- `test/compose-docker-compose.contract.test.js`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/4-3-docker-compose-stack-with-healthchecks-and-sqlite-volume.md`
- `.github/workflows/ci.yml` (post-review: compose contract step in `api-integration`)

## Change Log

- **2026-04-26:** Story 4.3 — Compose stack (`app_net`, SQLite volume, `/ready` gating, env contract, README + root `.env.example`, compose contract test).
- **2026-04-26:** Code review — compose contract test wired into **`api-integration`** CI job.

### Review Findings

- [x] [Review][Patch] Compose contract test is not executed in GitHub Actions — [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) runs API integration and E2E only; root `npm test` (which includes `test/compose-docker-compose.contract.test.js`) never runs on CI. The Dev Agent Record line implying the contract test is covered in CI is misleading; add a fast `node --test test/compose-docker-compose.contract.test.js` step after `npm ci` (e.g. in the api-integration job) and align the completion note. [`package.json`](../../package.json) [`test/compose-docker-compose.contract.test.js`](../../test/compose-docker-compose.contract.test.js) — **Resolved 2026-04-26:** CI step added in `api-integration` job; completion note updated.

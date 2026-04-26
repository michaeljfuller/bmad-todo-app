# Story 4.4: Container CI and documentation for deploy-shaped workflows

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an **operator**,
I want **CI to build container images** (and optionally run a **compose smoke** check),
So that **container regressions are caught before merge** and **runbooks match how we ship**.

## Acceptance Criteria

1. **Given** the Docker and Compose artifacts from Epic 4 (see **Prerequisites** below)  
   **When** CI runs on pull requests (and pushes to protected branches, matching existing triggers)  
   **Then** **`docker build`** (or **`docker compose build`**) **succeeds** for **`api`** and **`web`** using the paths defined in Architecture (e.g. **`docker/api.Dockerfile`**, **`docker/web.Dockerfile`**) with sensible defaults for any **build-args** (e.g. **`VITE_API_BASE_URL`** for the web image as documented in Story 4.2 / README).

2. **Given** the same CI pipeline  
   **Then** an **optional compose smoke** path is **documented** (README and/or inline workflow comments): e.g. **`docker compose up --build`**, wait for **healthy** services, hit **`/health`** / **`/ready`** on the API and a minimal check on **web**, and/or reuse **Epic 3 Playwright** against the composed stack when configured—call out **cost vs value** so the team can leave it optional or promote it later.

3. **Given** a new contributor or operator  
   **When** they read the root **README**  
   **Then** it includes a **“Run with Docker”** (or equivalent) section: **prerequisites** (Docker / Compose versions), **`docker compose up`** (or documented variant), **exposed ports**, **volume / persistence** for SQLite, and **troubleshooting** (common failures: port conflicts, unhealthy API, wrong **`VITE_API_BASE_URL`**, DB path).

4. **Given** a non-local deployment  
   **Then** **NFR-S2** is documented: **TLS/HTTPS** between browser and API in production is expected at the **reverse proxy or platform** edge (Fastify may remain HTTP behind TLS termination); align wording with PRD and Architecture—no secrets in images or committed **`.env`**.

## Tasks / Subtasks

- [ ] Add a **CI job** (or stage) that builds **`docker/api.Dockerfile`** and **`docker/web.Dockerfile`** on **`ubuntu-latest`**, with **Node-free** image build unless a build stage needs repo context—follow existing **`.github/workflows/ci.yml`** style (checkout, minimal secrets). (AC: #1)
  - [ ] Use **`docker compose build`** *or* two **`docker build`** invocations; pin **Docker BuildKit** behavior if the team standardizes on it.
  - [ ] Fail the job on **any** build error; keep logs readable (tag images with **`ci`** / **`pr-${{ github.event.number }}`** or **`local`** only—no push required unless product asks).
- [ ] Document **optional compose smoke** (commands, timeouts, health URLs, when to add a workflow step). (AC: #2)
  - [ ] If adding a workflow step: **start compose**, **wait-for-healthy**, **curl** or **`docker compose run`** smoke, **teardown**; consider **not** duplicating full Playwright unless runtime is acceptable.
- [ ] Extend **[`README.md`](../../README.md)** with **Run with Docker**: prerequisites, env from **`.env.example`**, ports, volumes, troubleshooting. (AC: #3)
- [ ] Add a short **Production / TLS (NFR-S2)** subsection (or link to Architecture) clarifying **termination at proxy** and **no TLS inside** default Node static setup unless changed. (AC: #4)

## Dev Notes

### Prerequisites (blocking context)

This story assumes **Stories 4.1–4.3** have landed (or you implement them first in the same branch):

- **4.1:** **`GET /health`**, **`GET /ready`** on the API (Compose health gates depend on these). [Source: `_bmad-output/planning-artifacts/epics.md` — Story 4.1]
- **4.2:** **`docker/api.Dockerfile`**, **`docker/web.Dockerfile`** — multi-stage, **non-root**, web serves **`client` `dist`**. [Source: `epics.md` — Story 4.2; `architecture.md` — Infrastructure & Deployment]
- **4.3:** Root **`docker-compose.yml`**, SQLite **volume**, **`depends_on`** + **`service_healthy`**, **healthcheck** → **`/health`** / **`/ready`**. [Source: `epics.md` — Story 4.3]

If CI runs before those files exist, the **build job will fail** until they do—order work accordingly.

### Architecture compliance

- **CI bar** (Architecture): at minimum extend the pipeline toward **lint + typecheck + unit + API integration + client production build + Playwright**; this story adds **image build** (and documents optional **compose smoke** / E2E-on-compose). [Source: `_bmad-output/planning-artifacts/architecture.md` — Infrastructure & Deployment, PR / CI bullet; `_bmad-output/project-context.md` — Development Workflow Rules]
- **Docker layout:** all production Docker logic under **`docker/`**; **one** **`docker-compose.yml`** at repo root; **`.env.example`** documents compose variables—do not commit real secrets. [Source: `architecture.md` — Project Structure / Compose behavioral contract]
- **Health:** Compose and Dockerfiles align with **`/health`** (liveness) and **`/ready`** (readiness). [Source: `architecture.md` — Health & operability]

### Current codebase (do not assume future files)

- **`.github/workflows/ci.yml`** today: **`api-integration`** and **`e2e`** jobs only—**no** `docker build` yet. E2E uses **`npm run dev:e2e-stack`** + **`wait-on`** on **`http://127.0.0.1:5199`**, not Compose. [Source: `.github/workflows/ci.yml`; `README.md` — Testing / E2E]
- Add a **new job** (or jobs) for image builds so failures are **isolated** and fast to diagnose; keep **existing jobs** unchanged unless a shared optimization is clearly safe.

### Library / platform requirements

- **GitHub Actions:** `ubuntu-latest` includes Docker; use **`docker compose` v2** syntax. Official actions (**`actions/checkout@v4`**, etc.) match the existing workflow.
- **No new application npm dependencies** are required for this story unless compose smoke invokes existing **`e2e`** scripts.

### File structure requirements

| Area | Path |
|------|------|
| CI | `.github/workflows/ci.yml` (or a new workflow file only if splitting reduces noise—prefer one workflow unless files become unwieldy) |
| Docs | `README.md` (root); optionally `_bmad-output/planning-artifacts/architecture.md` only if correcting drift—**not** required for AC |
| Compose / Docker | Consumed as outputs of 4.2–4.3; **do not** relocate without Architecture change |

### Testing requirements

- **Assert via CI:** green **`docker build`** / **`docker compose build`** on a clean checkout.
- **Manual:** README steps verified once locally (Docker installed).
- **Optional automated smoke:** if implemented, document the **wait** condition (healthcheck interval × retries + buffer) to avoid flaky CI.

### Project context reference

- Follow **`_bmad-output/project-context.md`**: **CI bar**, **Compose** **`depends_on`** + **`service_healthy`**, **layout** (`client/`, `api/`, `e2e/`, `docker/`, root compose).
- **Postman / API contract:** this story does **not** change the REST contract; no Postman collection update unless health routes are new in the same PR as 4.1 (then 4.1 owns it).

### Previous story intelligence

No **`4-3-*.md`** implementation artifact exists yet in **`implementation-artifacts/`**—use **Epic 4** stories in **`epics.md`** and **Architecture** as the source of truth for compose behavior.

### Latest technical notes (no upgrade mandate)

- Prefer **`docker compose`** (V2 plugin) over legacy **`docker-compose`** binary in docs and CI.
- **`DOCKER_BUILDKIT=1`** is default on current GHA Ubuntu images; only set explicitly if debugging cache issues.

## Dev Agent Record

### Agent Model Used

_(filled by dev agent)_

### Debug Log References

### Completion Notes List

### File List

_(filled by dev agent)_

---

**Story completion status:** Ultimate context engine analysis completed — comprehensive developer guide created.

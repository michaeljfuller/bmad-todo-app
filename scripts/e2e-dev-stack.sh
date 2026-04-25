#!/usr/bin/env bash
# Starts API (after migrations) and Vite client for Playwright E2E. Run from repo root via `npm run dev:e2e-stack`.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export DATABASE_PATH="${DATABASE_PATH:-$ROOT/api/data/e2e.db}"
# E2E client uses 5199 so `npm run dev` (5173/5174) does not collide with Playwright.
export CORS_ORIGIN="${CORS_ORIGIN:-http://127.0.0.1:5199}"
mkdir -p "$(dirname "$DATABASE_PATH")"
npm run db:migrate --workspace=api
# Production build + preview avoids Vite dev "504 Outdated Optimize Dep" on cold Playwright runs.
# Bind API to IPv4 loopback so wait-on (127.0.0.1) and the built client match. On Linux, listening
# only on ::1 leaves 127.0.0.1 unreachable and wait-on times out → exit 1 and Playwright webServer fails.
#
# Use `npm run start` (no `fastify -w` watch). Watch mode forks a child + chokidar; that stack often
# exits non‑zero on GitHub Actions while plain `start` is stable for CI E2E.
exec npx concurrently --kill-others-on-fail --names api,client \
  "FASTIFY_ADDRESS=127.0.0.1 npm run start --workspace api" \
  "npx wait-on http://127.0.0.1:3000/todos -t 120000 && VITE_API_BASE_URL=http://127.0.0.1:3000 npm run build --workspace client && npm run preview --workspace client -- --port 5199 --host 127.0.0.1 --strictPort"

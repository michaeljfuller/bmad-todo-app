# syntax=docker/dockerfile:1
# Build from repository root: docker build -f docker/api.Dockerfile .

FROM node:20-bookworm-slim AS deps

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
COPY api/package.json api/package.json
COPY client/package.json client/package.json
COPY e2e/package.json e2e/package.json

ENV NODE_ENV=production

RUN npm ci --workspace=api --omit=dev

FROM node:20-bookworm-slim AS runtime

RUN apt-get update \
  && apt-get install -y --no-install-recommends curl ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd --gid 1001 appgroup \
  && useradd --uid 1001 --gid appgroup --home-dir /home/appuser --create-home --shell /usr/sbin/nologin appuser \
  && install -d -o appuser -g appgroup /data

WORKDIR /app

COPY --from=deps --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --from=deps --chown=appuser:appgroup /app/package.json ./package.json
COPY --from=deps --chown=appuser:appgroup /app/package-lock.json ./package-lock.json
COPY --from=deps --chown=appuser:appgroup /app/api/package.json ./api/package.json
COPY --chown=appuser:appgroup client/package.json client/package.json
COPY --chown=appuser:appgroup e2e/package.json e2e/package.json

COPY --chown=appuser:appgroup api/app.js api/app.js
COPY --chown=appuser:appgroup api/plugins api/plugins
COPY --chown=appuser:appgroup api/routes api/routes
COPY --chown=appuser:appgroup api/db api/db
COPY --chown=appuser:appgroup api/schemas api/schemas
COPY --chown=appuser:appgroup api/scripts api/scripts
COPY --chown=appuser:appgroup api/migrations api/migrations

USER appuser

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
  CMD ["sh", "-c", "curl -fsS \"http://127.0.0.1:$${PORT:-3000}/health\" > /dev/null || exit 1"]

CMD ["npm", "run", "start", "--workspace=api"]

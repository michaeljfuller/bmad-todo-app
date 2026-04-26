# syntax=docker/dockerfile:1
# Build from repository root:
#   docker build -f docker/web.Dockerfile --build-arg VITE_API_BASE_URL=http://127.0.0.1:3000 .

FROM node:20-bookworm-slim AS build

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
COPY api/package.json api/package.json
COPY client/package.json client/package.json
COPY e2e/package.json e2e/package.json

RUN npm ci

COPY client client

ARG VITE_API_BASE_URL=http://127.0.0.1:3000
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN npm run build --workspace=client

FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime

COPY --from=build --chown=nginx:nginx /app/client/dist /usr/share/nginx/html
COPY docker/nginx-web.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/ || exit 1

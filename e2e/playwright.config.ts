import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';

/** Repo root when tests are run via `npm run test:e2e` (e2e package cwd). */
const repoRoot = path.resolve(process.cwd(), '..');

export default defineConfig({
  testDir: './tests',
  timeout: 90_000,
  expect: {
    timeout: 60_000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://127.0.0.1:5199',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev:e2e-stack',
    cwd: repoRoot,
    url: 'http://127.0.0.1:5199',
    // Always start the stack Playwright expects (avoids reusing a stale dev server on the same port).
    reuseExistingServer: false,
    timeout: 180_000,
  },
});

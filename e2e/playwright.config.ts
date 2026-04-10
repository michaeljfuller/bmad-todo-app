import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';

/**
 * Monorepo root for webServer `cwd`. In GitHub Actions we set `E2E_REPO_ROOT` to
 * `${{ github.workspace }}` because `working-directory: e2e` makes `process.cwd()`
 * the e2e folder (parent = root). Locally, `npm run test:e2e` also uses e2e as cwd.
 */
const repoRoot =
  process.env.E2E_REPO_ROOT?.trim() ||
  path.resolve(process.cwd(), '..');

const isCi = !!process.env.CI;

export default defineConfig({
  testDir: './tests',
  timeout: 90_000,
  expect: {
    timeout: 60_000,
  },
  fullyParallel: true,
  forbidOnly: isCi,
  retries: isCi ? 2 : 0,
  workers: isCi ? 1 : undefined,
  reporter: isCi
    ? [['github'], ['html', { open: 'never' }]]
    : 'html',
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

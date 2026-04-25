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
/** In GitHub Actions, start the stack in the workflow (see .github/workflows/ci.yml) so logs are visible. */
const externalE2EStack = !!process.env.PLAYWRIGHT_E2E_EXTERNAL_SERVER;

const webServer = externalE2EStack
  ? undefined
  : {
      command: 'npm run dev:e2e-stack',
      cwd: repoRoot,
      url: 'http://127.0.0.1:5199' as const,
      // When Playwright spawns the stack, don't reuse; local devs may still run with a server up via reuse in older configs.
      reuseExistingServer: false,
      timeout: 180_000,
    };

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
  ...(webServer ? { webServer } : {}),
});

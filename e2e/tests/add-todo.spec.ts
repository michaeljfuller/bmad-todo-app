import { expect, test } from '@playwright/test';

/**
 * Story 3.4 AC#6: same stack as other todo E2E specs — `npm run dev:e2e-stack`
 * from repo root (API + Vite preview; `VITE_API_BASE_URL` set for the client).
 */
test.describe('add todo (Story 3.4)', () => {
  test('typing and submitting shows the new task in the list', async ({
    page,
  }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const unique = `E2E add ${Date.now()}`;
    await page.getByRole('textbox', { name: /new task/i }).fill(unique);
    await page.getByRole('button', { name: /^add$/i }).click();

    await expect(
      page.getByRole('listitem').filter({ hasText: unique }),
    ).toBeVisible({ timeout: 60_000 });
  });
});

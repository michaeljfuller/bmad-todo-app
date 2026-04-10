import { expect, test } from '@playwright/test';

/**
 * Story 3.3 AC#5: `baseURL` is `http://127.0.0.1:5199` (see `e2e/playwright.config.ts`).
 * Stack: `npm run dev:e2e-stack` — API + Vite preview; client uses `VITE_API_BASE_URL`.
 * CI sets `DATABASE_PATH` to a fresh temp file → empty todos. Locally, delete
 * `api/data/e2e.db` (or point `DATABASE_PATH` at a new file) if you need an empty list.
 */
test.describe('todo app empty shell (Story 3.3)', () => {
  test('shows title, empty state copy, and composer when there are no todos', async ({
    page,
  }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await expect(
      page.getByRole('heading', { name: /todo app/i }),
    ).toBeVisible();

    await expect(page.getByTestId('todo-empty-state')).toBeVisible({
      timeout: 60_000,
    });
    await expect(page.getByText(/nothing here yet/i)).toBeVisible();
    await expect(
      page.getByText(/add a task below to get started/i),
    ).toBeVisible();

    await expect(page.getByTestId('add-todo-form')).toBeVisible();
    await expect(
      page.getByRole('textbox', { name: /new task/i }),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: /^add$/i })).toBeVisible();
  });
});

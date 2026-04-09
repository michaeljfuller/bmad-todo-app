import { expect, test } from '@playwright/test';

test.describe('todo list load (AC#8)', () => {
  test('shows the todo list region after a successful API load', async ({
    page,
  }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(
      page.getByRole('heading', { name: /todo app/i }),
    ).toBeVisible();
    const list = page.getByTestId('todo-list');
    await expect(list).toBeVisible({ timeout: 60_000 });
    await expect(list.getByText(/no todos yet/i)).toBeVisible();
  });
});

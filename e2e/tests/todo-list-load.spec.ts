import { expect, test } from '@playwright/test';

test.describe('todo list load (AC#8)', () => {
  test('shows the todo list region after a successful API load', async ({
    page,
  }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(
      page.getByRole('heading', { name: /todo app/i }),
    ).toBeVisible();
    // After load: empty DB shows todo-empty-state; non-empty DB shows todo-list rows.
    const empty = page.getByTestId('todo-empty-state');
    const list = page.getByTestId('todo-list');
    await expect(empty.or(list)).toBeVisible({ timeout: 60_000 });
    await expect(
      empty
        .getByText(/nothing here yet/i)
        .or(list.locator('li').first()),
    ).toBeVisible();
  });
});

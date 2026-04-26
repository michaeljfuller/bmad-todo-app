import { expect, test } from '@playwright/test';
import { clearAllTodos } from '../helpers/clearAllTodos';

/**
 * Story 3.5: complete, uncomplete, delete — same stack as other todo E2E specs.
 */
test.describe('todo row actions (Story 3.5)', () => {
  test.beforeEach(async ({ request }) => {
    await clearAllTodos(request);
  });

  test('mark complete then mark active again', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const label = `E2E toggle ${Date.now()}`;
    await page.getByRole('textbox', { name: /new task/i }).fill(label);
    await page.getByRole('button', { name: /^add$/i }).click();

    const rowCheckbox = page.getByRole('checkbox', { name: new RegExp(label, 'i') });
    await expect(rowCheckbox).toBeVisible({ timeout: 60_000 });

    await rowCheckbox.click();
    await expect(rowCheckbox).toBeChecked({ timeout: 15_000 });

    const labelEl = page.getByText(label, { exact: true });
    await expect(labelEl).toHaveClass(/line-through/);

    await rowCheckbox.click();
    await expect(rowCheckbox).not.toBeChecked({ timeout: 15_000 });
  });

  test('delete removes the row', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const label = `E2E delete ${Date.now()}`;
    await page.getByRole('textbox', { name: /new task/i }).fill(label);
    await page.getByRole('button', { name: /^add$/i }).click();

    const row = page
      .getByTestId('todo-list')
      .getByRole('listitem')
      .filter({ hasText: label });
    await expect(row).toBeVisible({ timeout: 60_000 });

    await row
      .getByRole('button', { name: new RegExp(`delete task: ${label}`, 'i') })
      .click();

    await expect(row).toBeHidden({ timeout: 15_000 });
  });
});

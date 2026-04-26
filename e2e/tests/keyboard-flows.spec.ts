import { expect, test } from '@playwright/test';
import { clearAllTodos } from '../helpers/clearAllTodos';

/**
 * Story 3.6 AC#2 / AC#5: keyboard path — same stack as other todo E2E specs
 * (`npm run dev:e2e-stack` from repo root).
 *
 * Tab order: page title (h1) → each row checkbox → delete → composer (field, Add).
 * Space toggles checkbox when focused; Enter submits Add from the text field.
 */
test.describe('keyboard flows (Story 3.6)', () => {
  test.beforeEach(async ({ request }) => {
    await clearAllTodos(request);
  });

  test('Tab order title → list → composer; Space toggles checkbox; Enter submits Add', async ({
    page,
  }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const title = page.getByRole('heading', { name: /todo app/i });
    const textbox = page.getByRole('textbox', { name: /new task/i });
    const addBtn = page.getByRole('button', { name: /^add$/i });

    await expect(textbox).toBeVisible({ timeout: 60_000 });

    await page.keyboard.press('Tab');
    await expect(title).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(textbox).toBeFocused();

    const unique = `E2E keyboard ${Date.now()}`;
    await textbox.fill(unique);
    await page.keyboard.press('Enter');

    const rowCheckbox = page.getByRole('checkbox', {
      name: new RegExp(unique, 'i'),
    });
    await expect(rowCheckbox).toBeVisible({ timeout: 60_000 });

    // Tab from the last control does not reliably wrap to the page title in Chromium; assert
    // title → list → composer by moving focus to the title (keyboard user returning to the top),
    // then Tab into the first row checkbox.
    await title.focus();
    await page.keyboard.press('Tab');
    await expect(rowCheckbox).toBeFocused();

    await expect(rowCheckbox).not.toBeChecked();
    await page.keyboard.press('Space');
    await expect(rowCheckbox).toBeChecked({ timeout: 15_000 });
    await expect(rowCheckbox).toBeEnabled({ timeout: 15_000 });
    // Query + row may re-render after PATCH; keep focus on the checkbox for the second keypress.
    await rowCheckbox.focus();

    await page.keyboard.press('Space');
    await expect(rowCheckbox).not.toBeChecked({ timeout: 15_000 });

    await page.keyboard.press('Tab');
    await expect(
      page.getByRole('button', {
        name: new RegExp(`delete task: ${unique}`, 'i'),
      }),
    ).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(textbox).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(addBtn).toBeFocused();
  });
});

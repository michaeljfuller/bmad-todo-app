import { expect, test } from '@playwright/test';

test('smoke: about:blank loads', async ({ page }) => {
  await page.goto('about:blank');
  await expect(page).toHaveURL('about:blank');
});

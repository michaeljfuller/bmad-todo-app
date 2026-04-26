import { expect, test } from '@playwright/test';

import {
  clearAllTodos,
  e2eApiBaseUrl,
  isTodosCollectionUrl,
} from '../helpers/clearAllTodos';

/**
 * Failure simulation: Playwright `page.route` aborts or returns 5xx for browser `fetch`
 * to the API; the real API process keeps data so we can assert no silent empty list and
 * recovery after Retry or a second submit.
 */
test.describe.configure({ mode: 'serial' });

test.describe('todo error + recovery (Story 3.7 AC#2)', () => {
  test.beforeEach(async ({ request }) => {
    await clearAllTodos(request);
  });

  test('failed GET /todos then Retry loads persisted todos (no false empty state)', async ({
    page,
    request,
  }) => {
    const api = e2eApiBaseUrl();
    const title = `Error recovery GET ${Date.now()}`;
    const post = await request.post(`${api}/todos`, {
      data: { text: title },
      headers: { Accept: 'application/json' },
    });
    expect(post.ok(), await post.text()).toBeTruthy();

    // Client QueryClient uses `retry: 1` on queries — fail the initial fetch and the one retry
    // before the error banner appears; the next GET (user Retry) succeeds.
    let getFailuresRemaining = 2;
    await page.route(
      (url) => isTodosCollectionUrl(url, api),
      async (route) => {
        if (route.request().method() !== 'GET') {
          await route.continue();
          return;
        }
        if (getFailuresRemaining > 0) {
          getFailuresRemaining -= 1;
          await route.abort('failed');
          return;
        }
        await route.continue();
      },
    );

    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const banner = page.getByTestId('todo-list-error-banner');
    await expect(banner).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId('todo-empty-state')).not.toBeVisible();
    await expect(page.getByTestId('todo-list')).not.toBeVisible();

    await page.getByRole('button', { name: /^retry$/i }).click();

    await expect(page.getByTestId('todo-list')).toBeVisible({ timeout: 60_000 });
    await expect(
      page.getByRole('listitem').filter({ hasText: title }),
    ).toBeVisible();
    await expect(banner).not.toBeVisible();

    await page.unroute((url) => isTodosCollectionUrl(url, api));
  });

  test('failed POST create then second submit succeeds; list matches server', async ({
    page,
    request,
  }) => {
    const api = e2eApiBaseUrl();
    const title = `POST retry ${Date.now()}`;

    let posts = 0;
    await page.route(
      (url) => isTodosCollectionUrl(url, api),
      async (route) => {
        if (route.request().method() !== 'POST') {
          await route.continue();
          return;
        }
        posts += 1;
        if (posts === 1) {
          await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({
              error: {
                code: 'INTERNAL',
                message: 'forced failure for e2e',
              },
            }),
          });
          return;
        }
        await route.continue();
      },
    );

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('todo-empty-state')).toBeVisible({
      timeout: 60_000,
    });

    await page.getByRole('textbox', { name: /new task/i }).fill(title);
    await page.getByRole('button', { name: /^add$/i }).click();

    await expect(page.locator('#add-todo-error')).toBeVisible();
    await expect(page.getByRole('listitem')).toHaveCount(0);

    await page.getByRole('button', { name: /^add$/i }).click();

    await expect(
      page.getByRole('listitem').filter({ hasText: title }),
    ).toBeVisible({ timeout: 60_000 });

    const listRes = await request.get(`${api}/todos`);
    expect(listRes.ok()).toBeTruthy();
    const body = (await listRes.json()) as { todos: Array<{ text: string }> };
    expect(body.todos.map((t) => t.text)).toContain(title);

    await page.unroute((url) => isTodosCollectionUrl(url, api));
  });
});

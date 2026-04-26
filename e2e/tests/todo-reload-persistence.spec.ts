import { expect, test } from '@playwright/test';

import { clearAllTodos, e2eApiBaseUrl } from '../helpers/clearAllTodos';

/**
 * Failure simulation: N/A — this file asserts reload parity with the real API only.
 * Story 3.7 AC#1: reload shows persisted server state (same DATABASE_PATH for the whole run).
 */
test.describe.configure({ mode: 'serial' });

test.describe('todo reload persistence (Story 3.7 AC#1)', () => {
  test.beforeEach(async ({ request }) => {
    await clearAllTodos(request);
  });

  test('after seeding via API, reload shows the same todos as GET /todos', async ({
    page,
    request,
  }) => {
    const api = e2eApiBaseUrl();
    const titles = [`Reload A ${Date.now()}`, `Reload B ${Date.now()}`];
    for (const text of titles) {
      const res = await request.post(`${api}/todos`, {
        data: { text },
        headers: { Accept: 'application/json' },
      });
      expect(res.ok(), await res.text()).toBeTruthy();
    }

    const listBefore = await request.get(`${api}/todos`);
    expect(listBefore.ok()).toBeTruthy();
    const { todos: expected } = (await listBefore.json()) as {
      todos: Array<{ id: number; text: string }>;
    };

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('todo-list')).toBeVisible({
      timeout: 60_000,
    });
    for (const t of expected) {
      await expect(
        page.getByRole('listitem').filter({ hasText: t.text }),
      ).toBeVisible();
    }

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('todo-list')).toBeVisible({
      timeout: 60_000,
    });

    const listAfter = await request.get(`${api}/todos`);
    expect(listAfter.ok()).toBeTruthy();
    const { todos: afterReload } = (await listAfter.json()) as {
      todos: Array<{ text: string }>;
    };

    expect(afterReload.map((x) => x.text)).toEqual(expected.map((x) => x.text));
    await expect(page.getByRole('listitem')).toHaveCount(afterReload.length);
    for (const t of afterReload) {
      await expect(
        page.getByRole('listitem').filter({ hasText: t.text }),
      ).toBeVisible();
    }
  });
});

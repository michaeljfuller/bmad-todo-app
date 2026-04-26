import type { APIRequestContext } from '@playwright/test';

const DEFAULT_API = 'http://127.0.0.1:3000';

/** API origin for E2E stack (`scripts/e2e-dev-stack.sh`); override if the job uses a different port. */
export function e2eApiBaseUrl(): string {
  return (process.env.E2E_API_BASE_URL ?? DEFAULT_API).replace(/\/$/, '');
}

/** `GET|POST /todos` (collection), not `/todos/:id`. Matches browser `fetch` URLs for Playwright `route`. */
export function isTodosCollectionUrl(url: URL, apiBase: string): boolean {
  const base = new URL(apiBase.replace(/\/$/, ''));
  if (url.origin !== base.origin) return false;
  return url.pathname === '/todos';
}

/** Removes all rows so specs that require an empty list are not affected by run order. */
export async function clearAllTodos(request: APIRequestContext): Promise<void> {
  const base = e2eApiBaseUrl();
  const listRes = await request.get(`${base}/todos`);
  if (!listRes.ok()) {
    throw new Error(
      `GET ${base}/todos failed: ${listRes.status()} ${await listRes.text()}`,
    );
  }
  const body = (await listRes.json()) as { todos: Array<{ id: number }> };
  for (const { id } of body.todos) {
    const del = await request.delete(`${base}/todos/${id}`);
    if (!del.ok()) {
      throw new Error(
        `DELETE ${base}/todos/${id} failed: ${del.status()} ${await del.text()}`,
      );
    }
  }
}

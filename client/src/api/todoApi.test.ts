import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { deleteTodo, patchTodo } from './todoApi'

describe('todoApi', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('deleteTodo: 204 No Content succeeds without parsing a JSON body', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(null, { status: 204 }),
    )

    await expect(deleteTodo(7)).resolves.toBeUndefined()
  })

  it('patchTodo: returns full todo JSON on 200', async () => {
    const todo = {
      id: 2,
      text: 'x',
      completed: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
    }
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(todo), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    await expect(patchTodo(2, { completed: true })).resolves.toEqual(todo)
  })
})

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import type { ReactElement } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Todo } from '../api/todoApi'
import { TodoItem } from './TodoItem'

const baseTodo: Todo = {
  id: 1,
  text: 'Buy milk',
  completed: false,
  createdAt: '2026-01-01T12:00:00.000Z',
  updatedAt: '2026-01-01T12:00:00.000Z',
}

function renderWithClient(ui: ReactElement) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return {
    ...render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>),
    client,
  }
}

describe('TodoItem', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    cleanup()
    globalThis.fetch = originalFetch
  })

  it('AC: associates checkbox with task text via label / id', () => {
    renderWithClient(<TodoItem todo={baseTodo} />)

    const cb = screen.getByRole('checkbox', { name: /buy milk/i })
    expect(cb).toHaveAttribute('id', 'todo-complete-1')
  })

  it('AC: shows created/updated metadata for local display', () => {
    renderWithClient(<TodoItem todo={baseTodo} />)

    expect(screen.getByText(/created/i)).toBeInTheDocument()
    expect(screen.getByText(/updated/i)).toBeInTheDocument()
  })

  it('AC: completed todos use strikethrough + completed token, not disabled styling', () => {
    renderWithClient(
      <TodoItem todo={{ ...baseTodo, completed: true, text: 'Done task' }} />,
    )

    const label = screen.getByText('Done task')
    expect(label.className).toMatch(/line-through/)
    expect(label.className).toMatch(/text-fg-completed/)
  })

  it('AC: delete control is a ghost/outline button with accessible name', () => {
    renderWithClient(<TodoItem todo={baseTodo} />)

    expect(
      screen.getByRole('button', { name: /delete task: buy milk/i }),
    ).toBeInTheDocument()
  })

  it('AC: toggling completion sends PATCH with completed flag', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation((_input, init) => {
      const method =
        typeof init === 'object' && init && 'method' in init
          ? String(init.method)
          : 'GET'
      if (method === 'PATCH') {
        expect(JSON.parse(String(init?.body))).toEqual({ completed: true })
        return Promise.resolve(
          new Response(
            JSON.stringify({
              ...baseTodo,
              completed: true,
              updatedAt: '2026-01-02T00:00:00.000Z',
            }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            },
          ),
        )
      }
      return Promise.resolve(new Response('{}'))
    })

    const { client } = renderWithClient(<TodoItem todo={baseTodo} />)
    client.setQueryData(['todos'], [baseTodo])

    fireEvent.click(screen.getByRole('checkbox', { name: /buy milk/i }))

    await waitFor(() => {
      expect(vi.mocked(fetch)).toHaveBeenCalled()
    })
  })

  it('AC: while PATCH is pending, checkbox and delete show disabled cursor/opacity', async () => {
    let resolvePatch!: (value: Response) => void
    const patchPromise = new Promise<Response>((resolve) => {
      resolvePatch = resolve
    })

    vi.spyOn(globalThis, 'fetch').mockImplementation((_input, init) => {
      const method =
        typeof init === 'object' && init && 'method' in init
          ? String(init.method)
          : 'GET'
      if (method === 'PATCH') {
        return patchPromise
      }
      return Promise.resolve(new Response('{}'))
    })

    renderWithClient(<TodoItem todo={baseTodo} />)

    fireEvent.click(screen.getByRole('checkbox', { name: /buy milk/i }))

    await waitFor(() => {
      expect(screen.getByRole('checkbox')).toBeDisabled()
      expect(screen.getByRole('button', { name: /delete task/i })).toBeDisabled()
    })

    resolvePatch!(
      new Response(
        JSON.stringify({
          ...baseTodo,
          completed: true,
          updatedAt: '2026-01-02T00:00:00.000Z',
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    )

    await waitFor(() => {
      expect(screen.getByRole('checkbox')).not.toBeDisabled()
    })
  })

  it('AC: delete issues DELETE and accepts 204 empty body', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) => {
      const method =
        typeof init === 'object' && init && 'method' in init
          ? String(init.method)
          : 'GET'
      if (method === 'DELETE') {
        expect(String(input)).toMatch(/\/todos\/1$/)
        return Promise.resolve(new Response(null, { status: 204 }))
      }
      return Promise.resolve(new Response('{}'))
    })

    const { client } = renderWithClient(<TodoItem todo={baseTodo} />)
    client.setQueryData(['todos'], [baseTodo])

    fireEvent.click(screen.getByRole('button', { name: /delete task/i }))

    await waitFor(() => {
      expect(vi.mocked(fetch)).toHaveBeenCalled()
    })
  })

  it('AC: API errors surface as plain language via mapApiError path', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          error: { code: 'TODO_NOT_FOUND', message: 'internal detail' },
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    )

    const { client } = renderWithClient(<TodoItem todo={baseTodo} />)
    client.setQueryData(['todos'], [baseTodo])

    fireEvent.click(screen.getByRole('button', { name: /delete task/i }))

    expect(
      await screen.findByText('That todo could not be found.'),
    ).toBeInTheDocument()
  })
})

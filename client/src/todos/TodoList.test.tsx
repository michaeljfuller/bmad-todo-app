import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactElement } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TodoList } from './TodoList'

function renderWithClient(ui: ReactElement) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
  return {
    ...render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>),
    client,
  }
}

describe('TodoList', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('AC#4: shows loading copy and skeletons while the query has no data', () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      () => new Promise<Response>(() => {}),
    )

    renderWithClient(<TodoList />)

    expect(screen.getByText('Loading todos…')).toBeInTheDocument()
    expect(screen.getByLabelText('Todo list loading')).toBeInTheDocument()
  })

  it('AC#5: shows plain error and Retry; refetch succeeds on second attempt', async () => {
    let calls = 0
    vi.spyOn(globalThis, 'fetch').mockImplementation(() => {
      calls += 1
      if (calls === 1) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              error: {
                code: 'INTERNAL',
                message: 'secret stack trace at foo.js:99',
              },
            }),
            {
              status: 500,
              headers: { 'Content-Type': 'application/json' },
            },
          ),
        )
      }
      return Promise.resolve(
        new Response(JSON.stringify({ todos: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
    })

    renderWithClient(<TodoList />)

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(
      'Something went wrong on our end. Please try again.',
    )
    expect(alert.textContent).not.toMatch(/secret stack/)

    fireEvent.click(screen.getByRole('button', { name: /^retry$/i }))

    await waitFor(() => {
      expect(screen.getByTestId('todo-empty-state')).toBeInTheDocument()
    })
    expect(screen.getByText('Nothing here yet')).toBeInTheDocument()
  })
})

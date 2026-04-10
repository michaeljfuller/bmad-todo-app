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
import { AddTodoForm } from './AddTodoForm'

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

const todoJson = {
  id: 1,
  text: 'Buy milk',
  completed: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

describe('AddTodoForm', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    cleanup()
    globalThis.fetch = originalFetch
  })

  it('AC#5: disables input and Add while create request is pending', async () => {
    let resolvePost!: (value: Response) => void
    const postPromise = new Promise<Response>((resolve) => {
      resolvePost = resolve
    })

    vi.spyOn(globalThis, 'fetch').mockImplementation((_input, init) => {
      const method =
        typeof init === 'object' && init && 'method' in init
          ? String(init.method)
          : 'GET'
      if (method === 'POST') {
        return postPromise
      }
      return Promise.resolve(new Response('{}'))
    })

    renderWithClient(<AddTodoForm />)

    const input = screen.getByRole('textbox', { name: /new task/i })
    const button = screen.getByRole('button', { name: /^add$/i })

    fireEvent.change(input, { target: { value: 'Buy milk' } })
    fireEvent.click(button)

    await waitFor(() => {
      expect(button).toBeDisabled()
      expect(input).toBeDisabled()
    })

    resolvePost!(
      new Response(JSON.stringify(todoJson), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    await waitFor(() => {
      expect(button).not.toBeDisabled()
      expect(input).not.toBeDisabled()
    })
  })

  it('AC#5: success path invalidates the todos query', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation((_input, init) => {
      const method =
        typeof init === 'object' && init && 'method' in init
          ? String(init.method)
          : 'GET'
      if (method === 'POST') {
        return Promise.resolve(
          new Response(JSON.stringify(todoJson), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
          }),
        )
      }
      return Promise.resolve(new Response('{}'))
    })

    const { client } = renderWithClient(<AddTodoForm />)
    const invalidateSpy = vi.spyOn(client, 'invalidateQueries')

    fireEvent.change(screen.getByRole('textbox', { name: /new task/i }), {
      target: { value: 'Buy milk' },
    })
    fireEvent.click(screen.getByRole('button', { name: /^add$/i }))

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['todos'] })
    })
  })

  it('AC#2: duplicate programmatic submit does not enqueue a second POST', async () => {
    let resolvePost!: (value: Response) => void
    const postPromise = new Promise<Response>((resolve) => {
      resolvePost = resolve
    })
    let postCount = 0

    vi.spyOn(globalThis, 'fetch').mockImplementation((_input, init) => {
      const method =
        typeof init === 'object' && init && 'method' in init
          ? String(init.method)
          : 'GET'
      if (method === 'POST') {
        postCount += 1
        return postPromise
      }
      return Promise.resolve(new Response('{}'))
    })

    renderWithClient(<AddTodoForm />)

    const field = screen.getByRole('textbox', { name: /new task/i })
    fireEvent.change(field, { target: { value: 'One' } })
    await waitFor(() => {
      expect(field).toHaveValue('One')
    })
    const form = screen.getByTestId('add-todo-form')
    fireEvent.submit(form)
    fireEvent.submit(form)

    await waitFor(() => {
      expect(postCount).toBe(1)
    })

    resolvePost!(
      new Response(JSON.stringify(todoJson), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    await waitFor(() => {
      expect(postCount).toBe(1)
    })
  })

  it('AC#4: shows mapped API error for failed create', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation((_input, init) => {
      const method =
        typeof init === 'object' && init && 'method' in init
          ? String(init.method)
          : 'GET'
      if (method === 'POST') {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              error: {
                code: 'VALIDATION_ERROR',
                message: 'ignored for mapping',
              },
            }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            },
          ),
        )
      }
      return Promise.resolve(new Response('{}'))
    })

    renderWithClient(<AddTodoForm />)

    fireEvent.change(screen.getByRole('textbox', { name: /new task/i }), {
      target: { value: 'x' },
    })
    fireEvent.click(screen.getByRole('button', { name: /^add$/i }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Please check your input and try again.')
  })
})
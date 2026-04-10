import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Todo } from '../api/todoApi'
import { TodoApp } from './TodoApp'
import * as useTodosQueryModule from './useTodosQuery'

vi.mock('./useTodosQuery', () => ({
  TODOS_QUERY_KEY: ['todos'],
  useTodosQuery: vi.fn(),
}))

function renderTodoApp() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <TodoApp />
    </QueryClientProvider>,
  )
}

describe('TodoApp', () => {
  beforeEach(() => {
    vi.mocked(useTodosQueryModule.useTodosQuery).mockReset()
  })

  it('AC#4: empty success shows shell order, empty copy, scroll layout, and composer', () => {
    vi.mocked(useTodosQueryModule.useTodosQuery).mockReturnValue({
      data: [] as Todo[],
      isSuccess: true,
      isPending: false,
      isError: false,
      error: null,
      isFetching: false,
      refetch: vi.fn(),
      status: 'success',
      fetchStatus: 'idle',
    } as unknown as ReturnType<typeof useTodosQueryModule.useTodosQuery>)

    renderTodoApp()

    const layout = screen.getByTestId('todo-app-layout')
    expect(layout).toHaveClass('min-h-0', 'flex-1', 'flex-col')

    const children = [...layout.children]
    expect(children[0]?.tagName.toLowerCase()).toBe('header')
    expect(children[1]).toHaveAttribute('data-testid', 'todo-list-scroll')
    expect(children[2]?.tagName.toLowerCase()).toBe('form')

    const scroll = screen.getByTestId('todo-list-scroll')
    expect(scroll).toHaveClass('min-h-0', 'flex-1', 'overflow-y-auto')

    expect(screen.getByRole('heading', { name: /todo app/i })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(/nothing here yet/i)
    expect(screen.getByText(/add a task below to get started/i)).toBeInTheDocument()
    expect(screen.getByTestId('add-todo-form')).toBeInTheDocument()
    expect(
      screen.getByRole('textbox', { name: /new task/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^add$/i })).toBeInTheDocument()
  })
})

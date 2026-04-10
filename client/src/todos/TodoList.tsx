import { QueryErrorBanner } from './QueryErrorBanner'
import { useTodosQuery } from './useTodosQuery'

export function TodoList() {
  const { data, isPending, isError, error, refetch, isFetching } =
    useTodosQuery()

  if (isError) {
    const message =
      error instanceof Error ? error.message : 'Something went wrong.'
    return (
      <section
        className="flex min-h-0 flex-1 flex-col overflow-y-auto"
        aria-label="Todo list"
        data-testid="todo-list-scroll"
      >
        <div className="flex flex-col gap-4 pt-1">
          <QueryErrorBanner
            message={message}
            onRetry={() => {
              void refetch()
            }}
            isRetrying={isFetching}
          />
        </div>
      </section>
    )
  }

  if (isPending) {
    return (
      <section
        className="flex min-h-0 flex-1 flex-col overflow-y-auto"
        aria-busy="true"
        aria-label="Todo list loading"
        data-testid="todo-list-scroll"
      >
        <p className="text-fg-secondary">Loading todos…</p>
        <ul className="mt-3 flex flex-col gap-2" aria-hidden>
          {[0, 1, 2].map((i) => (
            <li
              key={i}
              className="h-10 animate-pulse rounded-md bg-fg-primary/10"
            />
          ))}
        </ul>
      </section>
    )
  }

  const todos = data ?? []

  return (
    <section
      className="flex min-h-0 flex-1 flex-col overflow-y-auto"
      aria-label="Todo list"
      data-testid="todo-list-scroll"
    >
      {todos.length === 0 ? (
        <div
          role="status"
          aria-live="polite"
          data-testid="todo-empty-state"
          className="flex flex-col gap-2 py-2"
        >
          <p className="text-lg font-semibold text-fg-primary">
            Nothing here yet
          </p>
          <p className="text-base text-fg-secondary">
            Add a task below to get started.
          </p>
        </div>
      ) : (
        <ul data-testid="todo-list" className="flex flex-col gap-2">
          {todos.map((t) => (
            <li
              key={t.id}
              className="rounded-md border border-fg-primary/15 px-3 py-2 text-fg-primary"
            >
              {t.text}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

import { QueryErrorBanner } from './QueryErrorBanner'
import { useTodosQuery } from './useTodosQuery'

export function TodoListPanel() {
  const { data, isPending, isError, error, refetch, isFetching } =
    useTodosQuery()

  if (isError) {
    const message =
      error instanceof Error ? error.message : 'Something went wrong.'
    return (
      <section
        className="flex flex-col gap-4"
        aria-label="Todo list"
        data-testid="todo-list-region"
      >
        <QueryErrorBanner
          message={message}
          onRetry={() => {
            void refetch()
          }}
          isRetrying={isFetching}
        />
      </section>
    )
  }

  if (isPending) {
    return (
      <section
        className="flex flex-col gap-3"
        aria-busy="true"
        aria-label="Todo list loading"
        data-testid="todo-list-region"
      >
        <p className="text-fg-secondary">Loading todos…</p>
        <ul className="flex flex-col gap-2" aria-hidden>
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
      className="flex flex-col gap-2"
      aria-label="Todo list"
      data-testid="todo-list-region"
    >
      <ul data-testid="todo-list" className="flex flex-col gap-2">
        {todos.length === 0 ? (
          <li className="text-sm text-fg-secondary">No todos yet.</li>
        ) : (
          todos.map((t) => (
            <li
              key={t.id}
              className="rounded-md border border-fg-primary/15 px-3 py-2 text-fg-primary"
            >
              {t.text}
            </li>
          ))
        )}
      </ul>
    </section>
  )
}

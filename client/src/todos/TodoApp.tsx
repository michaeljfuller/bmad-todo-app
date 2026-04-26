import { AddTodoForm } from './AddTodoForm'
import { TodoList } from './TodoList'

export function TodoApp() {
  return (
    <div className="flex min-h-dvh min-w-0 flex-col overflow-x-hidden bg-surface-page">
      <div
        className="mx-auto flex min-h-0 w-full min-w-0 max-w-lg flex-1 flex-col px-4 py-6 lg:max-w-2xl"
        data-testid="todo-app-layout"
      >
        <header className="shrink-0 pb-4">
          <h1
            tabIndex={0}
            className="inline-block rounded-sm text-2xl font-semibold tracking-tight text-fg-primary outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface-page"
          >
            Todo app
          </h1>
        </header>
        <TodoList />
        <AddTodoForm />
      </div>
    </div>
  )
}

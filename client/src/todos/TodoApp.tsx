import { AddTodoForm } from './AddTodoForm'
import { TodoList } from './TodoList'

export function TodoApp() {
  return (
    <div className="flex min-h-dvh flex-col bg-surface-page">
      <div
        className="mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col px-4 py-6"
        data-testid="todo-app-layout"
      >
        <header className="shrink-0 pb-4">
          <h1 className="text-2xl font-semibold tracking-tight text-fg-primary">
            Todo app
          </h1>
        </header>
        <TodoList />
        <AddTodoForm />
      </div>
    </div>
  )
}

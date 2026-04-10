import { TodoListPanel } from './todos/TodoListPanel'

function App() {
  return (
    <div className="min-h-dvh bg-surface-page px-4 py-8">
      <main className="mx-auto flex max-w-lg flex-col gap-6">
        <header>
          <h1 className="text-2xl font-medium tracking-tight text-fg-primary">
            Todo app
          </h1>
          <p className="mt-2 text-fg-secondary leading-relaxed">
            Your list loads from the API. Retry if something goes wrong.
          </p>
        </header>

        <TodoListPanel />
      </main>
    </div>
  )
}

export default App

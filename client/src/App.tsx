import { DesignSurfaceSample } from './components/DesignSurfaceSample'

function App() {
  return (
    <div className="min-h-dvh bg-surface-page px-4 py-8">
      <main className="mx-auto flex max-w-lg flex-col gap-6">
        <header>
          <h1 className="text-2xl font-medium tracking-tight text-fg-primary">
            Todo app
          </h1>
          <p className="mt-2 text-fg-secondary leading-relaxed">
            Visual baseline placeholder. List and data loading ship in later
            stories.
          </p>
        </header>

        <DesignSurfaceSample />

        <div className="flex flex-col gap-3">
          <button
            type="button"
            className="inline-flex w-fit rounded-md bg-accent-primary px-4 py-2 text-sm font-medium text-on-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            Primary action
          </button>
          <p
            className="rounded-md border border-fg-error/40 bg-surface-error px-3 py-2 text-sm text-fg-error"
            role="status"
          >
            Error message preview
          </p>
        </div>
      </main>
    </div>
  )
}

export default App

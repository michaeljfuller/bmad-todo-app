export function AddTodoForm() {
  return (
    <form
      data-testid="add-todo-form"
      className="shrink-0 border-t border-fg-primary/15 bg-surface-page pt-4 pb-2"
      aria-label="Add new task"
      onSubmit={(e) => {
        e.preventDefault()
      }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm text-fg-secondary">
          New task
          <input
            type="text"
            name="text"
            autoComplete="off"
            placeholder="What needs doing?"
            className="rounded-md border border-fg-primary/15 bg-surface-panel px-3 py-2 text-base text-fg-primary placeholder:text-fg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-page"
          />
        </label>
        <button
          type="submit"
          className="inline-flex shrink-0 justify-center rounded-md bg-accent-primary px-4 py-2 text-sm font-medium text-on-accent focus-visible:ring-2 focus-visible:ring-fg-primary focus-visible:ring-offset-2 focus-visible:ring-offset-accent-primary focus-visible:outline-none"
        >
          Add
        </button>
      </div>
    </form>
  )
}

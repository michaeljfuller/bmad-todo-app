import { useRef, useState, type FormEvent } from 'react'
import { useCreateTodoMutation } from './useCreateTodoMutation'

export function AddTodoForm() {
  const [text, setText] = useState('')
  const submitGuardRef = useRef(false)
  const { mutate, isPending, isError, error, reset } = useCreateTodoMutation()

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (isPending || submitGuardRef.current) return
    const trimmed = text.trim()
    if (!trimmed) return

    submitGuardRef.current = true
    mutate(trimmed, {
      onSettled: () => {
        submitGuardRef.current = false
      },
      onSuccess: () => {
        setText('')
      },
    })
  }

  return (
    <form
      data-testid="add-todo-form"
      className="shrink-0 border-t border-fg-primary/15 bg-surface-page pt-4 pb-2"
      aria-label="Add new task"
      onSubmit={handleSubmit}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm text-fg-secondary">
          New task
          <input
            type="text"
            name="text"
            autoComplete="off"
            placeholder="What needs doing?"
            value={text}
            disabled={isPending}
            onChange={(ev) => {
              if (isError) reset()
              setText(ev.target.value)
            }}
            aria-invalid={isError}
            aria-describedby={isError ? 'add-todo-error' : undefined}
            className="min-h-[44px] rounded-md border border-fg-primary/15 bg-surface-panel px-3 py-2 text-base text-fg-primary placeholder:text-fg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface-page disabled:cursor-not-allowed disabled:opacity-60"
          />
        </label>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-md bg-accent-primary px-4 text-sm font-medium text-on-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-accent-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          Add
        </button>
      </div>
      {isError ? (
        <p
          id="add-todo-error"
          role="alert"
          aria-live="assertive"
          className="mt-2 text-sm text-fg-secondary"
        >
          {error instanceof Error ? error.message : 'Something went wrong.'}
        </p>
      ) : null}
    </form>
  )
}

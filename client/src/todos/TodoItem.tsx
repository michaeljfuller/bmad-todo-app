import type { Todo } from '../api/todoApi'
import { useDeleteTodoMutation } from './useDeleteTodoMutation'
import { usePatchTodoMutation } from './usePatchTodoMutation'

function formatTodoTimestamp(isoUtc: string): string {
  const d = new Date(isoUtc)
  if (Number.isNaN(d.getTime())) return isoUtc
  return d.toLocaleString(undefined, {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

export type TodoItemProps = {
  todo: Todo
}

export function TodoItem({ todo }: TodoItemProps) {
  const checkboxId = `todo-complete-${todo.id}`
  const patchMutation = usePatchTodoMutation()
  const deleteMutation = useDeleteTodoMutation()
  const pending = patchMutation.isPending || deleteMutation.isPending
  const rowError = patchMutation.error ?? deleteMutation.error
  const isError = patchMutation.isError || deleteMutation.isError

  function clearRowErrors() {
    patchMutation.reset()
    deleteMutation.reset()
  }

  return (
    <li className="rounded-md border border-fg-primary/15 bg-surface-panel/40 px-3 py-2">
      <div className="flex items-center gap-3">
        <span className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center self-center">
          <input
            id={checkboxId}
            type="checkbox"
            checked={todo.completed}
            disabled={pending}
            onChange={(ev) => {
              if (isError) clearRowErrors()
              patchMutation.mutate({
                id: todo.id,
                completed: ev.target.checked,
              })
            }}
            aria-labelledby={`${checkboxId}-label`}
            className="h-4 w-4 rounded border-fg-primary/30 text-accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface-panel disabled:cursor-not-allowed disabled:opacity-60"
          />
        </span>
        <div className="min-w-0 flex-1">
          <label
            id={`${checkboxId}-label`}
            htmlFor={checkboxId}
            className={
              todo.completed
                ? 'block cursor-pointer break-words text-base leading-snug text-fg-completed line-through'
                : 'block cursor-pointer break-words text-base leading-snug text-fg-primary'
            }
          >
            {todo.text}
          </label>
          <p className="mt-1 text-xs leading-normal text-fg-secondary">
            Created {formatTodoTimestamp(todo.createdAt)} · Updated{' '}
            {formatTodoTimestamp(todo.updatedAt)}
          </p>
        </div>
        <button
          type="button"
          disabled={pending}
          aria-label={`Delete task: ${todo.text}`}
          onClick={() => {
            if (isError) clearRowErrors()
            deleteMutation.mutate(todo.id)
          }}
          className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center self-center rounded-md border border-fg-primary/25 bg-transparent px-3 text-sm font-medium text-fg-secondary hover:bg-fg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface-panel disabled:cursor-not-allowed disabled:opacity-60"
        >
          Delete
        </button>
      </div>
      {isError ? (
        <p
          id={`todo-row-error-${todo.id}`}
          role="alert"
          aria-live="assertive"
          className="mt-2 text-sm text-fg-secondary"
        >
          {rowError instanceof Error
            ? rowError.message
            : 'Something went wrong.'}
        </p>
      ) : null}
    </li>
  )
}

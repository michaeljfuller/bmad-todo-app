type QueryErrorBannerProps = {
  message: string
  onRetry: () => void
  isRetrying?: boolean
}

export function QueryErrorBanner({
  message,
  onRetry,
  isRetrying = false,
}: QueryErrorBannerProps) {
  return (
    <div
      role="alert"
      data-testid="todo-list-error-banner"
      className="rounded-md border border-fg-error/40 bg-surface-error px-3 py-3 text-sm text-fg-error"
    >
      <p>{message}</p>
      <button
        type="button"
        onClick={onRetry}
        disabled={isRetrying}
        className="mt-2 inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md border border-fg-error/50 bg-surface-page px-3 text-sm font-medium text-fg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface-error disabled:opacity-60"
      >
        Retry
      </button>
    </div>
  )
}

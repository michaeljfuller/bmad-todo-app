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
      className="rounded-md border border-fg-error/40 bg-surface-error px-3 py-3 text-sm text-fg-error"
    >
      <p>{message}</p>
      <button
        type="button"
        onClick={onRetry}
        disabled={isRetrying}
        className="mt-2 inline-flex rounded-md border border-fg-error/50 bg-surface-page px-3 py-1.5 text-sm font-medium text-fg-primary focus-visible:ring-2 focus-visible:ring-fg-primary focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-60"
      >
        Retry
      </button>
    </div>
  )
}

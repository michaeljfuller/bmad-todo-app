/**
 * Minimal placeholder proving semantic Tailwind tokens apply in app + tests (Story 3.1).
 */
export function DesignSurfaceSample() {
  return (
    <div
      className="rounded-lg bg-surface-panel p-4 text-fg-secondary shadow-sm ring-1 ring-surface-row"
      data-testid="design-surface-sample"
    >
      <p className="text-sm text-fg-muted">Design surface sample</p>
      <p className="mt-2 text-fg-completed line-through">Completed item preview</p>
      <p className="mt-1 text-fg-disabled">Disabled control preview</p>
    </div>
  )
}

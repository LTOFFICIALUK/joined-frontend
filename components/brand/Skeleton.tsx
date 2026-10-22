export const Skeleton = ({ className = "h-16 w-full" }: { className?: string }) => (
  <div className={`animate-pulse rounded-card bg-line/80 ${className}`} role="status" aria-label="Loading" />
)

export const ApiDown = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
  <div className="rounded-card border border-line p-4">
    <p className="text-sm text-paper">{message}</p>
    <button type="button" onClick={onRetry} className="mt-3 rounded-full bg-teal px-4 py-2 font-display text-sm font-bold text-ink">
      Try again
    </button>
  </div>
)

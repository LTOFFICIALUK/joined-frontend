import type { ReactNode } from "react"

export const EmptyGuide = ({
  title,
  body,
  steps,
  action,
}: {
  title: string
  body: string
  steps: string[]
  action?: ReactNode
}) => (
  <div className="mt-8 rounded-card border border-line p-6">
    <p className="font-display text-lg font-bold">{title}</p>
    <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">{body}</p>
    <ol className="mt-4 space-y-2">
      {steps.map((step, index) => (
        <li key={step} className="flex gap-3 text-sm">
          <span className="font-display font-bold text-teal">{index + 1}</span>
          <span>{step}</span>
        </li>
      ))}
    </ol>
    {action ? <div className="mt-5 flex flex-wrap gap-2">{action}</div> : null}
  </div>
)

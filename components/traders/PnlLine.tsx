import type { PnlPoint } from "@/lib/api"
import { signedUsd } from "@/lib/format"

const stamp = (time: number) => {
  const ms = time > 0 && time < 1e12 ? time * 1000 : time
  if (!ms) return "Pending"
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(ms))
}

export const PnlLine = ({ points, bare = false, caption = "30 day P&L" }: { points: PnlPoint[]; bare?: boolean; caption?: string }) => {
  if (points.length < 2) {
    if (bare) return <div className="h-8 w-full" />
    return (
      <div className="w-full">
        <p className="text-xs text-muted">{caption}</p>
        <div className="mt-2 h-24 w-full animate-pulse rounded-card bg-line/70" />
        <p className="mt-2 text-xs leading-relaxed text-muted">The line shows when Hyperliquid has history for this wallet.</p>
      </div>
    )
  }
  const width = 320
  const height = 96
  const values = points.map((point) => point.v)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const path = points.map((point, index) => {
    const x = (index / (points.length - 1)) * width
    const y = height - 6 - ((point.v - min) / span) * (height - 12)
    return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`
  }).join(" ")
  const start = points[0]
  const end = points[points.length - 1]
  const high = points.reduce((best, point) => (point.v > best.v ? point : best), points[0])
  const up = (end?.v ?? 0) >= (start?.v ?? 0)
  return (
    <div className="w-full min-w-0">
      {bare ? null : <p className="mb-1 text-xs text-muted">{caption}</p>}
      <svg viewBox={`0 0 ${width} ${height}`} className={bare ? "h-8 w-full" : "h-28 w-full"} role="img" aria-label={caption}>
        <path d={path} fill="none" stroke={up ? "#50D2C1" : "#FF5C7A"} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      {bare || !start || !end || !high ? null : (
        <div className="mt-1 flex items-start justify-between gap-2 text-[10px] text-muted">
          <span className="min-w-0">{stamp(start.t)} {signedUsd(start.v)}</span>
          <span className="min-w-0 text-center">High {signedUsd(high.v)}</span>
          <span className="min-w-0 text-right">{stamp(end.t)} {signedUsd(end.v)}</span>
        </div>
      )}
    </div>
  )
}

import type { PnlPoint } from "@/lib/api"

export const PnlLine = ({ points }: { points: PnlPoint[] }) => {
  if (points.length < 2) {
    return <p className="flex h-16 items-center text-xs leading-relaxed text-muted">30 day P&L line will show when Hyperliquid has history for this wallet.</p>
  }
  const width = 280
  const height = 72
  const values = points.map((point) => point.v)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const path = points.map((point, index) => {
    const x = (index / (points.length - 1)) * width
    const y = height - 4 - ((point.v - min) / span) * (height - 8)
    return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`
  }).join(" ")
  const up = points[points.length - 1].v >= points[0].v
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-16 w-full" role="img" aria-label="30 day P and L">
      <path d={path} fill="none" stroke={up ? "#50D2C1" : "#FF5C7A"} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

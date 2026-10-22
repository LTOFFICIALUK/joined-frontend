import { ogCard, ogSize } from "@/components/brand/og"
import { apiUrl } from "@/lib/config"
import { compactUsd, signedUsd } from "@/lib/format"

export const size = ogSize
export const contentType = "image/png"
export const alt = "joined trader"

export default async function Image({ params }: { params: Promise<{ address: string }> }) {
  const { address } = await params
  let title = "Trader"
  let line = "Pending"
  if (apiUrl) {
    try {
      const res = await fetch(`${apiUrl}/traders/${address}`, { next: { revalidate: 60 } })
      if (res.ok) {
        const data = await res.json() as {
          trader?: {
            nickname?: string
            pnl30d?: number
            positions?: Array<{ label: string; side: string; positionValue: number; leverage: number }>
          }
        }
        title = data.trader?.nickname || "Trader"
        const pnl = typeof data.trader?.pnl30d === "number" ? signedUsd(data.trader.pnl30d) : "Pending"
        const lead = data.trader?.positions?.[0]
        const position = lead ? `${compactUsd(lead.positionValue)} ${lead.side} ${lead.label} · ${lead.leverage}x` : "Pending"
        line = `30 day ${pnl}. ${position}`
      }
    } catch {
      line = "Pending"
    }
  }
  return ogCard(title, line)
}

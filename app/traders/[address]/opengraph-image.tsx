import { ogCard, ogSize } from "@/components/brand/og"
import { compactUsd, signedUsd } from "@/lib/format"
import { loadTrader } from "@/lib/publicData"

export const size = ogSize
export const contentType = "image/png"
export const alt = "joined trader"

export default async function Image({ params }: { params: Promise<{ address: string }> }) {
  const { address } = await params
  let title = "Trader"
  let line = "Pending"
  const detail = await loadTrader(address)
  if (detail?.trader) {
    title = detail.trader.nickname || "Trader"
    const pnl = typeof detail.trader.pnl30d === "number" ? signedUsd(detail.trader.pnl30d) : "Pending"
    const lead = [...(detail.trader.positions ?? [])].sort((a, b) => b.positionValue - a.positionValue)[0]
    const position = lead ? `${compactUsd(lead.positionValue)} ${lead.side} ${lead.label} · ${lead.leverage}x` : "Pending"
    line = `30 day ${pnl}. ${position}`
  }
  return ogCard(title, line)
}

import { ogCard, ogSize } from "@/components/brand/og"
import { compactUsd } from "@/lib/format"
import { loadMarket } from "@/lib/publicData"

export const size = ogSize
export const contentType = "image/png"
export const alt = "joined market"

export default async function Image({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params
  const label = decodeURIComponent(ticker).toUpperCase()
  const market = await loadMarket(label)
  const line = market ? `Long ${compactUsd(market.longUsd)}. Short ${compactUsd(market.shortUsd)}.` : "Pending"
  return ogCard(label, line)
}

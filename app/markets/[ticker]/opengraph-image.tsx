import { ogCard, ogSize } from "@/components/brand/og"
import { apiUrl } from "@/lib/config"
import { compactUsd } from "@/lib/format"

export const size = ogSize
export const contentType = "image/png"
export const alt = "joined market"

export default async function Image({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params
  const label = decodeURIComponent(ticker).toUpperCase()
  let line = "Pending"
  if (apiUrl) {
    try {
      const res = await fetch(`${apiUrl}/traders/markets/${encodeURIComponent(label)}`, { next: { revalidate: 60 } })
      if (res.ok) {
        const data = await res.json() as { market?: { longUsd: number; shortUsd: number } }
        if (data.market) line = `Long ${compactUsd(data.market.longUsd)}. Short ${compactUsd(data.market.shortUsd)}.`
      }
    } catch {
      line = "Pending"
    }
  }
  return ogCard(label, line)
}

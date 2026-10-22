import { MarketsBoard } from "@/components/markets/MarketsBoard"
import { loadMarkets } from "@/lib/publicData"

export const revalidate = 30

export default async function MarketsPage() {
  const markets = await loadMarkets()
  return <MarketsBoard initial={markets} />
}

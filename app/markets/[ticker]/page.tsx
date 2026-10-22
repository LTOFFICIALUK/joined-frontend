import { MarketBoard } from "@/components/markets/MarketBoard"
import { loadMarket } from "@/lib/publicData"

export const revalidate = 30

export default async function MarketPage({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker: raw } = await params
  const ticker = decodeURIComponent(raw)
  const market = await loadMarket(ticker)
  return <MarketBoard ticker={ticker} initial={market} />
}

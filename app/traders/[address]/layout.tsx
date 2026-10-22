import type { Metadata } from "next"
import { BRAND } from "@/lib/config"
import { loadTrader } from "@/lib/publicData"

export const generateMetadata = async ({ params }: { params: Promise<{ address: string }> }): Promise<Metadata> => {
  const { address } = await params
  let title = "Trader"
  let description = "A Hyperliquid stock trader on joined."
  const detail = await loadTrader(address)
  if (detail?.trader) {
    title = detail.trader.nickname || "Trader"
    description = `${title} on joined. 30 day profit comes from Hyperliquid.`
  }
  return {
    title: { absolute: `joined: ${title}` },
    description,
    alternates: { canonical: `${BRAND.url}/traders/${address}` },
    openGraph: { title: `joined: ${title}`, description, url: `${BRAND.url}/traders/${address}` },
  }
}

export default function TraderLayout({ children }: { children: React.ReactNode }) {
  return children
}

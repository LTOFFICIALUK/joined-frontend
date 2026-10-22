import type { Metadata } from "next"
import { apiUrl, BRAND } from "@/lib/config"

export const generateMetadata = async ({ params }: { params: Promise<{ address: string }> }): Promise<Metadata> => {
  const { address } = await params
  let title = "Trader"
  let description = "A Hyperliquid stock trader on joined."
  if (apiUrl) {
    try {
      const res = await fetch(`${apiUrl}/traders/${address}`, { next: { revalidate: 60 } })
      if (res.ok) {
        const data = await res.json() as { trader?: { nickname?: string } }
        title = data.trader?.nickname || "Trader"
        description = `${title} on joined. 30 day profit comes from Hyperliquid.`
      }
    } catch {
      description = "A Hyperliquid stock trader on joined."
    }
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

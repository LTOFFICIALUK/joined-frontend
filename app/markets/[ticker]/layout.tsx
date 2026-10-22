import type { Metadata } from "next"
import { BRAND } from "@/lib/config"

export const generateMetadata = async ({ params }: { params: Promise<{ ticker: string }> }): Promise<Metadata> => {
  const { ticker } = await params
  const label = decodeURIComponent(ticker).toUpperCase()
  const description = `How the top wallets are positioned in ${label}.`
  return {
    title: { absolute: `joined: ${label}` },
    description,
    alternates: { canonical: `${BRAND.url}/markets/${label}` },
    openGraph: { title: `joined: ${label}`, description, url: `${BRAND.url}/markets/${label}` },
  }
}

export default function MarketLayout({ children }: { children: React.ReactNode }) {
  return children
}

import type { Metadata } from "next"

export const metadata: Metadata = {
  title: { absolute: "joined: Markets" },
  description: "Stock perps the top wallets hold, with the long and short split.",
}

export default function MarketsLayout({ children }: { children: React.ReactNode }) {
  return children
}

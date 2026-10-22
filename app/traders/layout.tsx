import type { Metadata } from "next"

export const metadata: Metadata = { title: { absolute: "joined: Traders" } }

export default function TradersLayout({ children }: { children: React.ReactNode }) {
  return children
}

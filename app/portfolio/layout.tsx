import type { Metadata } from "next"

export const metadata: Metadata = { title: { absolute: "joined: Portfolio" } }

export default function PortfolioLayout({ children }: { children: React.ReactNode }) {
  return children
}

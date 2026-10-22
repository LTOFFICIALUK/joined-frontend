import type { Metadata } from "next"

export const metadata: Metadata = { title: "Trader" }

export default function TraderLayout({ children }: { children: React.ReactNode }) {
  return children
}

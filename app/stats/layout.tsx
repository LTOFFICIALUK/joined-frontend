import type { Metadata } from "next"

export const metadata: Metadata = {
  title: { absolute: "joined: Stats" },
  description: "Wallets joined, copied value, and the newest copied trades.",
}

export default function StatsLayout({ children }: { children: React.ReactNode }) {
  return children
}

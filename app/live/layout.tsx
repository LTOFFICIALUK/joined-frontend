import type { Metadata } from "next"

export const metadata: Metadata = {
  title: { absolute: "joined: Live" },
  description: "New stock trades from the wallets on the board.",
}

export default function LiveLayout({ children }: { children: React.ReactNode }) {
  return children
}

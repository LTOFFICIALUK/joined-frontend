import { ogCard, ogSize } from "@/components/brand/og"

export const size = ogSize
export const contentType = "image/png"
export const alt = "joined markets"

export default function Image() {
  return ogCard("Markets", "Long and short across the top wallets.")
}

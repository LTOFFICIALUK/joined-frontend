import { ogCard, ogSize } from "@/components/brand/og"

export const size = ogSize
export const contentType = "image/png"
export const alt = "joined live"

export default function Image() {
  return ogCard("Live", "Stock trades from the top wallets.")
}

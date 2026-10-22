import { ogCard, ogSize } from "@/components/brand/og"

export const size = ogSize
export const contentType = "image/png"
export const alt = "joined traders"

export default function Image() {
  return ogCard("Traders", "One trader. Everyone joins in.")
}

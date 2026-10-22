import { ogCard, ogSize } from "@/components/brand/og"

export const size = ogSize
export const contentType = "image/png"
export const alt = "joined stats"

export default function Image() {
  return ogCard("Stats", "Joins and copied trades, once they exist.")
}

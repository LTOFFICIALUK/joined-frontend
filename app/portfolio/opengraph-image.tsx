import { ogCard, ogSize } from "@/components/brand/og"

export const size = ogSize
export const contentType = "image/png"
export const alt = "joined portfolio"

export default function Image() {
  return ogCard("Portfolio", "Copies, positions, and funds.")
}

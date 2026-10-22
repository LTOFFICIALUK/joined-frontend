import { ogCard, ogSize } from "@/components/brand/og"

export const size = ogSize
export const contentType = "image/png"
export const alt = "How joined works"

export default function Image() {
  return ogCard("How it works", "joined does not charge a copy fee.")
}

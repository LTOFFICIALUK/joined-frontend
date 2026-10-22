import { ogCard, ogSize } from "@/components/brand/og"

export const size = ogSize
export const contentType = "image/png"
export const alt = "joined terms"

export default function Image() {
  return ogCard("Terms", "Copy trading can lose money.")
}

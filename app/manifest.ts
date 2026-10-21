import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "joined",
    short_name: "joined",
    description: "Pick a top stock trader on Hyperliquid. Join, and your Phantom wallet follows every trade they make.",
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    icons: [{ src: "/brand/joined-pfp.png", sizes: "512x512", type: "image/png" }],
  }
}

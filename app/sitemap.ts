import type { MetadataRoute } from "next"
import { apiUrl, BRAND } from "@/lib/config"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const paths = ["", "/traders", "/markets", "/live", "/portfolio", "/how-it-works", "/stats", "/terms"]
  const pages: MetadataRoute.Sitemap = paths.map((path) => ({
    url: `${BRAND.url}${path}`,
    lastModified: now,
  }))
  if (!apiUrl) return pages
  try {
    const [tradersRes, marketsRes] = await Promise.all([
      fetch(`${apiUrl}/traders`, { next: { revalidate: 300 } }),
      fetch(`${apiUrl}/traders/markets`, { next: { revalidate: 300 } }),
    ])
    if (tradersRes.ok) {
      const data = await tradersRes.json() as { traders?: Array<{ address: string }> }
      for (const trader of data.traders ?? []) {
        pages.push({ url: `${BRAND.url}/traders/${trader.address}`, lastModified: now })
      }
    }
    if (marketsRes.ok) {
      const data = await marketsRes.json() as { markets?: Array<{ label: string }> }
      for (const market of data.markets ?? []) {
        pages.push({ url: `${BRAND.url}/markets/${market.label}`, lastModified: now })
      }
    }
  } catch {
    return pages
  }
  return pages
}

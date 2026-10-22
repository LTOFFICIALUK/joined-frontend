import type { MetadataRoute } from "next"
import { BRAND } from "@/lib/config"
import { loadMarkets, loadTraders } from "@/lib/publicData"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const paths = ["", "/traders", "/markets", "/live", "/portfolio", "/how-it-works", "/stats", "/terms"]
  const pages: MetadataRoute.Sitemap = paths.map((path) => ({
    url: `${BRAND.url}${path}`,
    lastModified: now,
  }))
  const [traders, markets] = await Promise.all([loadTraders(), loadMarkets()])
  for (const trader of traders?.traders ?? []) {
    pages.push({ url: `${BRAND.url}/traders/${trader.address}`, lastModified: now })
  }
  for (const market of markets ?? []) {
    pages.push({ url: `${BRAND.url}/markets/${market.label}`, lastModified: now })
  }
  return pages
}

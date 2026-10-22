import { StatsBoard } from "@/components/stats/StatsBoard"
import { loadStats } from "@/lib/publicData"

export const revalidate = 30

export default async function StatsPage() {
  const stats = await loadStats()
  return <StatsBoard initial={stats} />
}

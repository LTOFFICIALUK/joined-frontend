import { LiveBoard } from "@/components/live/LiveBoard"
import { loadTape } from "@/lib/publicData"

export const revalidate = 30

export default async function LivePage() {
  const tape = await loadTape()
  return <LiveBoard initial={tape} />
}

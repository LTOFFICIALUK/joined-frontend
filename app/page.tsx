import { Home } from "@/components/home/Home"
import { loadTape, loadTraders } from "@/lib/publicData"

export const revalidate = 30

export default async function Page() {
  const [board, tape] = await Promise.all([loadTraders(), loadTape()])
  return <Home initialTraders={board?.traders ?? null} initialTape={tape} />
}

import { TradersBoard } from "@/components/traders/TradersBoard"
import { loadTraders } from "@/lib/publicData"

export const revalidate = 30

export default async function TradersPage() {
  const board = await loadTraders()
  return <TradersBoard initial={board?.traders ?? null} asOf={board?.asOf ?? null} />
}

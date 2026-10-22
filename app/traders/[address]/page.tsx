import { TraderProfile } from "@/components/traders/TraderProfile"
import { loadJoiners, loadTrader, loadTraders } from "@/lib/publicData"
import { withNames } from "@/lib/traderStyle"

export const revalidate = 30

export default async function TraderPage({ params }: { params: Promise<{ address: string }> }) {
  const { address } = await params
  const [detail, joiners, board] = await Promise.all([
    loadTrader(address),
    loadJoiners(address),
    loadTraders(),
  ])
  return (
    <TraderProfile
      address={address}
      initialTrader={detail?.trader ?? null}
      initialFills={detail?.fills ?? []}
      initialJoiners={joiners}
      initialBoard={withNames(board?.traders ?? [])}
    />
  )
}

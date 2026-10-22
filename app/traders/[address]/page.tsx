"use client"

import { useParams } from "next/navigation"
import { useEffect, useLayoutEffect, useMemo, useState } from "react"
import { Hold } from "@/components/brand/Hold"
import { Avatar } from "@/components/traders/Avatar"
import { JoinFlow } from "@/components/traders/JoinFlow"
import { PnlLine } from "@/components/traders/PnlLine"
import { api, type Trader, type TraderFill } from "@/lib/api"
import { traderFromBoard } from "@/lib/boardCache"
import { compactUsd, shortAddr, signedUsd, when } from "@/lib/format"
import { groupPrints, monthStats, nicknameFor, positionBrief, printLine, riskOf } from "@/lib/traderStyle"

export default function TraderPage() {
  const params = useParams<{ address: string }>()
  const address = params.address
  const [trader, setTrader] = useState<Trader | null>(null)
  const [fills, setFills] = useState<TraderFill[]>([])
  const [error, setError] = useState("")
  const [showAllFills, setShowAllFills] = useState(false)
  const [showAllPositions, setShowAllPositions] = useState(false)
  const [fillsReady, setFillsReady] = useState(false)

  useLayoutEffect(() => {
    setTrader(traderFromBoard(address))
    setFills([])
    setFillsReady(false)
    setShowAllFills(false)
    setShowAllPositions(false)
    setError("")
  }, [address])

  useEffect(() => {
    let stop = false
    const load = async () => {
      try {
        const data = await api.trader(address)
        if (!stop) {
          setTrader(data.trader)
          setFills(data.fills)
          setFillsReady(true)
          setError("")
        }
      } catch (err) {
        if (!stop) setError(err instanceof Error ? err.message : "Could not reach joined.fun")
      }
    }
    void load()
    const timer = window.setInterval(() => void load(), 8000)
    return () => {
      stop = true
      window.clearInterval(timer)
    }
  }, [address])

  const prints = useMemo(() => groupPrints(fills), [fills])

  if (!trader && !error) return <section><Hold /></section>
  if (error && !trader) return <p className="text-sm text-down">{error}</p>
  if (!trader) return null

  const risk = riskOf(trader)
  const stats = monthStats(trader.pnl30Series)
  const win = trader.winRate ?? stats.winRate
  const drop = trader.maxDrop ?? stats.maxDrop
  const positions = showAllPositions ? trader.positions : trader.positions.slice(0, 5)
  const shownPrints = showAllFills ? prints : prints.slice(0, 8)

  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div>
        <div className="flex items-center gap-3">
          <Avatar address={trader.address} />
          <div className="min-w-0">
            <h1 className="truncate font-display text-3xl font-extrabold">{nicknameFor(trader)}</h1>
            <p className="mt-1 break-all font-mono text-xs text-muted">{trader.address}</p>
          </div>
        </div>
        <p className="mt-3 text-sm">
          <span className={risk === "High" ? "text-down" : risk === "Medium" ? "text-paper" : "text-teal"}>{risk} risk</span>
          <span className="text-muted"> · {shortAddr(trader.address)}</span>
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-card border border-line p-4">
            <p className={`font-display text-3xl font-extrabold ${trader.pnl30d >= 0 ? "text-teal" : "text-down"}`}>{signedUsd(trader.pnl30d)}</p>
            <p className="mt-1 text-xs text-muted">30 day P&L</p>
          </div>
          <div className="rounded-card border border-line p-4">
            <p className={`font-display text-3xl font-extrabold ${trader.pnl7d >= 0 ? "text-teal" : "text-down"}`}>{signedUsd(trader.pnl7d)}</p>
            <p className="mt-1 text-xs text-muted">7 day P&L</p>
          </div>
        </div>
        <p className="mt-4 text-sm text-muted">Account {compactUsd(trader.accountValue)}. Win rate {Math.round(win * 100)}%. Biggest drop {compactUsd(drop)}. {trader.joined > 0 ? `${trader.joined} joined.` : "Be the first to join."}</p>
        <div className="mt-4 rounded-card border border-line p-4">
          <PnlLine points={trader.pnl30Series} />
        </div>
        <h2 className="mt-8 font-display text-xl font-bold">Open stock positions</h2>
        {trader.positions.length ? (
          <>
            <ul className="mt-3 space-y-2">
              {positions.map((position) => (
                <li key={position.coin} className="rounded-card border border-line px-4 py-3 text-sm">
                  <p>{positionBrief(position)}</p>
                </li>
              ))}
            </ul>
            {trader.positions.length > 5 ? (
              <button type="button" onClick={() => setShowAllPositions((current) => !current)} className="mt-3 text-sm text-teal">
                {showAllPositions ? "Show fewer positions" : `Show all ${trader.positions.length} positions`}
              </button>
            ) : null}
          </>
        ) : (
          <p className="mt-3 text-sm text-muted">No open stock positions right now.</p>
        )}
        <h2 className="mt-8 font-display text-xl font-bold">Recent fills</h2>
        {!fillsReady ? <div className="mt-3 h-16" /> : shownPrints.length ? (
          <>
            <ul className="mt-3 space-y-2">
              {shownPrints.map((print) => (
                <li key={print.key} className="flex flex-wrap items-center justify-between gap-2 rounded-card border border-line px-4 py-3 text-sm">
                  <span>{printLine(print)}</span>
                  <span className="text-xs text-muted">{when(print.time)}</span>
                </li>
              ))}
            </ul>
            {prints.length > 8 ? (
              <button type="button" onClick={() => setShowAllFills((current) => !current)} className="mt-3 text-sm text-teal">
                {showAllFills ? "Show fewer fills" : `Show all ${prints.length} fills`}
              </button>
            ) : null}
          </>
        ) : (
          <p className="mt-3 text-sm text-muted">Recent stock fills will show up here after this trader trades a stock perp.</p>
        )}
      </div>
      <aside className="hidden h-fit rounded-card border border-line p-4 lg:sticky lg:top-28 lg:block">
        <JoinFlow trader={trader} formId="desk" />
      </aside>
      <div className="fixed inset-x-0 bottom-0 z-40 max-h-[70vh] overflow-y-auto border-t border-line bg-black px-4 py-3 lg:hidden">
        <JoinFlow trader={trader} formId="bar" compact />
      </div>
    </section>
  )
}

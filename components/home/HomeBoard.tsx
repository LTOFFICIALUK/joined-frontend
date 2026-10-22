"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { BubbleField } from "@/components/brand/Bubbles"
import { Avatar } from "@/components/traders/Avatar"
import { api, type TapePrint, type Trader } from "@/lib/api"
import { readBoard, writeBoard } from "@/lib/boardCache"
import { shortAddr, signedUsd, when } from "@/lib/format"
import { groupPrints, nicknameFor, positionBrief, printLine, riskOf } from "@/lib/traderStyle"

const Orbit = ({
  trader,
  count,
  orbitRef,
  showBubbles,
}: {
  trader: Trader | null
  count: number
  orbitRef: (node: HTMLDivElement | null) => void
  showBubbles: boolean
}) => {
  const decorative = count < 1
  return (
    <div className="mx-auto w-full max-w-[240px]">
      <div ref={orbitRef} className="relative mx-auto aspect-square w-full max-w-[220px] overflow-hidden">
        <div className={showBubbles ? "opacity-100" : "opacity-0"}>
          <BubbleField />
        </div>
        <div className="absolute left-1/2 top-1/2 z-10 flex h-[52%] w-[52%] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full bg-white px-2 text-center text-ink">
          {trader ? (
            <>
              <p className="font-mono text-[10px] text-ink">{shortAddr(trader.address)}</p>
              <p className="mt-0.5 font-display text-sm font-extrabold text-ink">{signedUsd(trader.pnl30d)}</p>
              <p className="text-[9px] text-ink/70">30 day P&L</p>
            </>
          ) : (
            <p className="font-display text-xs font-bold">Pending</p>
          )}
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-muted">
        {decorative ? "Be the first to join" : `${count} joined`}
      </p>
    </div>
  )
}

const Card = ({ trader, rank }: { trader: Trader; rank: number }) => {
  const lead = [...trader.positions].sort((a, b) => b.positionValue - a.positionValue)[0]
  const risk = riskOf(trader)
  return (
    <Link href={`/traders/${trader.address}`} className="block rounded-card border border-line p-4">
      <div className="flex items-center gap-3">
        <Avatar address={trader.address} />
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-bold">{nicknameFor(trader)}</p>
          <p className="font-mono text-[11px] text-muted">{shortAddr(trader.address)}</p>
        </div>
        <p className="ml-auto font-display text-xs text-muted">#{rank}</p>
      </div>
      <p className={`mt-3 font-display text-2xl font-extrabold ${trader.pnl30d >= 0 ? "text-teal" : "text-down"}`}>{signedUsd(trader.pnl30d)}</p>
      <p className="mt-1 text-xs text-muted">30 day P&L · {risk} risk</p>
      {lead ? <p className="mt-3 text-sm">{positionBrief(lead)}</p> : null}
      <p className="mt-3 text-xs text-teal">View trader</p>
    </Link>
  )
}

export const HomeBoard = ({
  orbitRef,
  showBubbles,
  onReady,
}: {
  orbitRef: (node: HTMLDivElement | null) => void
  showBubbles: boolean
  onReady: () => void
}) => {
  const [traders, setTraders] = useState<Trader[] | null>(null)
  const [tape, setTape] = useState<TapePrint[]>([])
  const [error, setError] = useState("")

  useEffect(() => {
    let stop = false
    const cached = readBoard()
    if (cached) {
      setTraders(cached)
      onReady()
    }
    const load = async () => {
      try {
        const data = await api.traders()
        if (stop) return
        writeBoard(data.traders)
        setTraders(data.traders)
        setError("")
        onReady()
      } catch (err) {
        if (stop) return
        setError(err instanceof Error ? err.message : "Could not reach joined.fun")
        onReady()
      }
    }
    const loadTape = async () => {
      try {
        const data = await api.tape()
        if (!stop) setTape(data.tape)
      } catch {
        if (!stop) setTape([])
      }
    }
    void load()
    void loadTape()
    const timer = window.setInterval(() => {
      void load()
      void loadTape()
    }, 8000)
    return () => {
      stop = true
      window.clearInterval(timer)
    }
  }, [onReady])

  const top = traders?.[0] ?? null
  const cards = traders?.slice(0, 4) ?? []
  const prints = groupPrints(tape).slice(0, 6)
  const nameFor = (address: string) => {
    const found = traders?.find((trader) => trader.address.toLowerCase() === address.toLowerCase())
    return found ? nicknameFor(found) : shortAddr(address)
  }

  return (
    <div className="mt-10">
      {error ? <p className="mb-6 text-sm text-down">{error}</p> : null}
      {traders && !traders.length && !error ? (
        <p className="mb-6 text-sm text-muted">No open stock positions on the leaderboard right now. Traders with open Hyperliquid stock perps will show up here.</p>
      ) : null}
      <Orbit trader={top} count={top?.joined ?? 0} orbitRef={orbitRef} showBubbles={showBubbles} />
      {prints.length ? (
        <ul className="mt-8 space-y-2" aria-label="Live trades">
          {prints.map((print) => (
            <li key={print.key} className="flex items-center justify-between gap-3 text-sm">
              <span className="min-w-0 truncate"><span className="text-muted">{print.address ? nameFor(print.address) : "Trader"}</span> {printLine(print)}</span>
              <span className="shrink-0 text-xs text-muted">{when(print.time)}</span>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {cards.map((trader, index) => (
          <Card key={trader.address} trader={trader} rank={index + 1} />
        ))}
      </div>
    </div>
  )
}

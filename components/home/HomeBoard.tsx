"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { BubbleField } from "@/components/brand/Bubbles"
import { Avatar } from "@/components/traders/Avatar"
import { ApiDown } from "@/components/brand/Skeleton"
import { TickerLink } from "@/components/markets/TickerLink"
import { api, type TapePrint, type Trader } from "@/lib/api"
import { readBoard, writeBoard } from "@/lib/boardCache"
import { compactUsd, shortAddr, signedUsd, when } from "@/lib/format"
import { groupPrints, nicknameFor, printBits, riskOf, withNames } from "@/lib/traderStyle"

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
              <span className="origin-center scale-75"><Avatar address={trader.address} /></span>
              <p className="mt-1 line-clamp-2 font-display text-[10px] font-bold leading-tight text-ink">{nicknameFor(trader)}</p>
              <p className="font-display text-xs font-extrabold text-ink">{signedUsd(trader.pnl30d)}</p>
            </>
          ) : (
            <p className="font-display text-xs font-bold">Pending</p>
          )}
        </div>
      </div>
      {count < 0 ? null : (
        <p className="mt-3 text-center text-xs text-muted">
          {decorative ? "Be the first to join" : `${count} joined`}
        </p>
      )}
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
      {lead ? (
        <p className="mt-3 text-sm">
          {compactUsd(lead.positionValue)} {lead.side} <TickerLink label={lead.label} /> · {lead.leverage}x
        </p>
      ) : null}
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
  const [tape, setTape] = useState<TapePrint[] | null>(null)
  const [error, setError] = useState("")
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let stop = false
    const cached = readBoard()
    if (cached) {
      setTraders(withNames(cached))
      onReady()
    }
    const load = async () => {
      try {
        const data = await api.traders()
        if (stop) return
        const named = withNames(data.traders)
        writeBoard(named)
        setTraders(named)
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
        if (!stop) setTape((current) => current ?? [])
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
  }, [onReady, attempt])

  const top = traders?.[0] ?? null
  const cards = traders?.slice(0, 4) ?? []
  const prints = groupPrints(tape ?? []).slice(0, 6)
  const nameFor = (address: string) => {
    const found = traders?.find((trader) => trader.address.toLowerCase() === address.toLowerCase())
    return found ? nicknameFor(found) : shortAddr(address)
  }

  return (
    <div className="mt-10">
      {error ? <div className="mb-6"><ApiDown message={error} onRetry={() => setAttempt((value) => value + 1)} /></div> : null}
      {traders && !traders.length && !error ? (
        <p className="mb-6 text-sm text-muted">No open stock positions on the leaderboard right now. Traders with open Hyperliquid stock perps will show up here.</p>
      ) : null}
      <Orbit trader={top} count={traders ? (top?.joined ?? 0) : -1} orbitRef={orbitRef} showBubbles={showBubbles} />
      <Link href="/live" className="mt-8 flex items-center gap-2 font-display text-sm font-bold">
        <span className="h-2 w-2 animate-pulse rounded-full bg-teal" aria-hidden="true" />
        Live trades from the top wallets
      </Link>
      {prints.length ? (
        <ul className="mt-3 space-y-2" aria-label="Live trades from the top wallets">
          {prints.map((print) => {
            const bits = printBits(print)
            return (
              <li key={print.key} className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate">
                  <span className="text-muted">{print.nickname || (print.address ? nameFor(print.address) : "Trader")}</span>{" "}
                  {bits.verb} {bits.size} <TickerLink label={print.label} /> at ${bits.price}
                </span>
                <span className="shrink-0 text-xs text-muted">{when(print.time)}</span>
              </li>
            )
          })}
        </ul>
      ) : tape ? (
        <p className="mt-3 text-sm text-muted">The first trade from these wallets lands here.</p>
      ) : null}
      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {cards.map((trader, index) => (
          <Card key={trader.address} trader={trader} rank={index + 1} />
        ))}
      </div>
    </div>
  )
}

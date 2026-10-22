"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { BubbleField } from "@/components/brand/Bubbles"
import { PnlLine } from "@/components/traders/PnlLine"
import { api, type Trader } from "@/lib/api"
import { readBoard, writeBoard } from "@/lib/boardCache"
import { shortAddr, signedUsd, usd } from "@/lib/format"

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
    <div className="mx-auto w-full max-w-[440px]">
      <div ref={orbitRef} className="relative mx-auto aspect-square w-full max-w-[420px]">
        <div className={showBubbles ? "opacity-100" : "opacity-0"}>
          <BubbleField />
        </div>
        <div className="absolute left-1/2 top-1/2 z-10 flex h-[46%] w-[46%] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full bg-white px-3 text-center text-ink">
          {trader ? (
            <>
              <p className="font-mono text-[11px] text-ink sm:text-xs">{shortAddr(trader.address)}</p>
              <p className="mt-1 font-display text-xl font-extrabold text-ink sm:text-3xl">{signedUsd(trader.pnl7d)}</p>
              <p className="mt-1 text-[10px] text-ink/70">7 day P&L</p>
            </>
          ) : (
            <p className="font-display text-sm font-bold">Pending</p>
          )}
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-muted">
        {decorative ? "No one has joined yet" : `${count} joined`}
      </p>
    </div>
  )
}

const Card = ({ trader, rank }: { trader: Trader; rank: number }) => {
  const lead = [...trader.positions].sort((a, b) => b.positionValue - a.positionValue)[0]
  return (
    <Link href={`/traders/${trader.address}`} className="block rounded-card border border-line p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-xs text-muted">{shortAddr(trader.address)}</p>
        <p className="font-display text-xs text-muted">#{rank}</p>
      </div>
      <p className={`mt-3 font-display text-3xl font-extrabold ${trader.pnl7d >= 0 ? "text-teal" : "text-down"}`}>{signedUsd(trader.pnl7d)}</p>
      <p className="mt-1 text-xs text-muted">7 day P&L</p>
      <p className="mt-3 text-sm text-muted">Account ${usd(trader.accountValue)}</p>
      {lead ? (
        <p className="mt-3 text-sm">
          <span className={lead.side === "long" ? "text-teal" : "text-down"}>{lead.side === "long" ? "Long" : "Short"}</span>
          {" "}{lead.label}, ${usd(lead.positionValue)}, {lead.leverage}x
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
    void load()
    const timer = window.setInterval(() => void load(), 8000)
    return () => {
      stop = true
      window.clearInterval(timer)
    }
  }, [onReady])

  const top = traders?.[0] ?? null
  const cards = traders?.slice(0, 4) ?? []

  return (
    <div className="mt-10">
      {error ? <p className="mb-6 text-sm text-down">{error}</p> : null}
      {traders && !traders.length && !error ? (
        <p className="mb-6 text-sm text-muted">No open stock positions on the leaderboard right now. Traders with open Hyperliquid stock perps will show up here.</p>
      ) : null}
      <Orbit trader={top} count={top?.joined ?? 0} orbitRef={orbitRef} showBubbles={showBubbles} />
      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {cards.map((trader, index) => (
          <Card key={trader.address} trader={trader} rank={index + 1} />
        ))}
      </div>
    </div>
  )
}

"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { PnlLine } from "@/components/traders/PnlLine"
import { api, type Trader } from "@/lib/api"
import { shortAddr, signedUsd, usd } from "@/lib/format"

const Orbit = ({ trader, count }: { trader: Trader | null; count: number }) => {
  const decorative = count < 1
  const total = decorative ? 7 : Math.min(count, 48)
  return (
    <div className="mx-auto w-full max-w-[440px]">
      <div className="relative mx-auto aspect-square w-full max-w-[420px]">
        <div className="absolute left-1/2 top-1/2 h-[78%] w-[78%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-line" />
        {Array.from({ length: total }, (_, index) => {
          const angle = (index / total) * Math.PI * 2 - Math.PI / 2
          const radius = 42
          const left = 50 + Math.cos(angle) * radius
          const top = 50 + Math.sin(angle) * radius
          return (
            <span
              key={index}
              className={`absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal ${decorative ? "opacity-30" : ""}`}
              style={{ left: `${left}%`, top: `${top}%` }}
            />
          )
        })}
        <div className="absolute left-1/2 top-1/2 flex h-[46%] w-[46%] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full bg-white px-3 text-center text-ink">
          {trader ? (
            <>
              <p className="font-mono text-[11px] sm:text-xs">{shortAddr(trader.address)}</p>
              <p className={`mt-1 font-display text-xl font-extrabold sm:text-3xl ${trader.pnl7d >= 0 ? "text-teal" : "text-down"}`}>{signedUsd(trader.pnl7d)}</p>
              <p className="mt-1 text-[10px] uppercase tracking-wide text-ink/60">7 day P&L</p>
            </>
          ) : (
            <p className="font-display text-sm font-bold">Pending</p>
          )}
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-muted">
        {decorative ? "Decoration" : `${count} joined`}
      </p>
    </div>
  )
}

const Card = ({ trader, rank }: { trader: Trader; rank: number }) => {
  const lead = trader.positions[0]
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
          <span className={lead.side === "long" ? "text-teal" : "text-down"}>{lead.side.toUpperCase()}</span>
          {" "}{lead.label}, ${usd(lead.positionValue)}, {lead.leverage}x
        </p>
      ) : null}
    </Link>
  )
}

export const HomeBoard = () => {
  const [traders, setTraders] = useState<Trader[] | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    let stop = false
    const load = async () => {
      try {
        const data = await api.traders()
        if (!stop) {
          setTraders(data.traders)
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
  }, [])

  const top = traders?.[0] ?? null
  const cards = traders?.slice(0, 4) ?? []

  return (
    <div className="mt-10">
      {error ? <p className="mb-6 text-sm text-down">{error}</p> : null}
      {traders && !traders.length && !error ? (
        <p className="mb-6 text-sm text-muted">No open stock positions on the leaderboard right now. Traders with open Hyperliquid stock perps will show up here.</p>
      ) : null}
      {traders === null && !error ? <p className="text-sm text-muted">Loading the Hyperliquid leaderboard.</p> : null}
      {traders ? <Orbit trader={top} count={top?.joined ?? 0} /> : null}
      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {cards.map((trader, index) => (
          <Card key={trader.address} trader={trader} rank={index + 1} />
        ))}
      </div>
    </div>
  )
}

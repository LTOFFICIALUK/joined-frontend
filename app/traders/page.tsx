"use client"

import Link from "next/link"
import { useEffect, useLayoutEffect, useState } from "react"
import { Hold } from "@/components/brand/Hold"
import { PnlLine } from "@/components/traders/PnlLine"
import { api, type Trader } from "@/lib/api"
import { readBoard, writeBoard } from "@/lib/boardCache"
import { shortAddr, signedUsd, sz, usd } from "@/lib/format"

export default function TradersPage() {
  const [traders, setTraders] = useState<Trader[] | null>(null)
  const [error, setError] = useState("")

  useLayoutEffect(() => {
    const cached = readBoard()
    if (cached) setTraders(cached)
  }, [])

  useEffect(() => {
    let stop = false
    const load = async () => {
      try {
        const data = await api.traders()
        if (!stop) {
          writeBoard(data.traders)
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

  return (
    <section>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-extrabold">Traders</h1>
          <p className="mt-2 max-w-xl text-sm text-muted">Top Hyperliquid wallets with open stock perps. 7 day and 30 day P&L update live.</p>
        </div>
        <span className="mb-1 inline-flex items-center gap-2 text-xs text-muted">
          <span className="h-2.5 w-2.5 rounded-full bg-teal shadow-[0_0_12px_rgba(80,210,193,0.9)]" />
          Live
        </span>
      </div>
      {error ? <p className="mt-6 text-sm text-down">{error}</p> : null}
      {traders && !traders.length && !error ? (
        <p className="mt-8 rounded-card border border-line p-6 text-sm leading-relaxed text-muted">No open stock positions on the leaderboard right now. When a top wallet has an open Hyperliquid stock perp, it shows up here with 7 day P&L, 30 day P&L, and a Join button.</p>
      ) : null}
      {traders === null && !error ? <Hold /> : null}
      <div className={`mt-6 space-y-3 ${traders ? "motion-safe:animate-settle" : ""}`}>
        {traders?.map((trader, index) => (
          <article key={trader.address} className="rounded-card border border-line p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-mono text-sm">{shortAddr(trader.address)}</p>
                <p className="mt-1 text-xs text-muted">#{index + 1}, account ${usd(trader.accountValue)}{trader.joined > 0 ? `, ${trader.joined} joined` : ""}</p>
              </div>
              <Link href={`/traders/${trader.address}`} className="rounded-full bg-teal px-4 py-2 font-display text-sm font-bold text-ink">
                Join
              </Link>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <p className={`font-display text-2xl font-extrabold ${trader.pnl7d >= 0 ? "text-teal" : "text-down"}`}>{signedUsd(trader.pnl7d)}</p>
                <p className="text-xs text-muted">7 day P&L</p>
              </div>
              <div>
                <p className={`font-display text-2xl font-extrabold ${trader.pnl30d >= 0 ? "text-teal" : "text-down"}`}>{signedUsd(trader.pnl30d)}</p>
                <p className="text-xs text-muted">30 day P&L</p>
              </div>
            </div>
            <div className="mt-4">
              <PnlLine points={trader.pnl30Series} />
            </div>
            <ul className="mt-4 space-y-2">
              {trader.positions.slice(0, 4).map((position) => (
                <li key={position.coin} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span>
                    <span className={position.side === "long" ? "text-teal" : "text-down"}>{position.side === "long" ? "Long" : "Short"}</span>
                    {" "}{position.label}
                  </span>
                  <span className="font-mono text-xs text-muted">{sz(position.size)}, {position.leverage}x, ${usd(position.positionValue)}</span>
                </li>
              ))}
              {trader.positions.length > 4 ? (
                <li className="text-xs text-muted">{trader.positions.length - 4} more positions</li>
              ) : null}
            </ul>
          </article>
        ))}
      </div>
    </section>
  )
}

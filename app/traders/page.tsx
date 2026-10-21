"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { PnlLine } from "@/components/traders/PnlLine"
import { api, type Trader } from "@/lib/api"
import { shortAddr, signedUsd, sz, usd } from "@/lib/format"

export default function TradersPage() {
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

  return (
    <section>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-extrabold">Traders</h1>
          <p className="mt-2 max-w-xl text-sm text-muted">Top Hyperliquid wallets with open stock perps. 7 day and 30 day P&L update live.</p>
        </div>
        <span className="mb-1 inline-flex items-center gap-2 text-xs text-muted">
          <span className="h-2 w-2 rounded-full bg-teal" />
          Live
        </span>
      </div>
      {error ? <p className="mt-6 text-sm text-down">{error}</p> : null}
      {traders && !traders.length && !error ? (
        <p className="mt-8 rounded-card border border-line p-6 text-sm text-muted">No open stock positions on the leaderboard right now. Traders with open Hyperliquid stock perps will show up here.</p>
      ) : null}
      {traders === null && !error ? <p className="mt-8 text-sm text-muted">Loading the Hyperliquid leaderboard.</p> : null}
      <div className="mt-6 space-y-3">
        {traders?.map((trader, index) => (
          <article key={trader.address} className="rounded-card border border-line p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-mono text-sm">{shortAddr(trader.address)}</p>
                <p className="mt-1 text-xs text-muted">#{index + 1}, account ${usd(trader.accountValue)}, {trader.joined} joined</p>
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
              {trader.positions.map((position) => (
                <li key={position.coin} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span>
                    <span className={position.side === "long" ? "text-teal" : "text-down"}>{position.side === "long" ? "Long" : "Short"}</span>
                    {" "}{position.label}
                  </span>
                  <span className="font-mono text-xs text-muted">{sz(position.size)}, {position.leverage}x, ${usd(position.positionValue)}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  )
}

"use client"

import Link from "next/link"
import { useEffect, useLayoutEffect, useMemo, useState } from "react"
import { Hold } from "@/components/brand/Hold"
import { PnlLine } from "@/components/traders/PnlLine"
import { api, type Trader } from "@/lib/api"
import { readBoard, writeBoard } from "@/lib/boardCache"
import { shortAddr, signedUsd, sz, usd } from "@/lib/format"

type SortKey = "pnl7d" | "pnl30d" | "accountValue"
type SideKey = "all" | "long" | "short"

const sorts: Array<{ id: SortKey; label: string }> = [
  { id: "pnl7d", label: "7 day" },
  { id: "pnl30d", label: "30 day" },
  { id: "accountValue", label: "Account" },
]

const sides: Array<{ id: SideKey; label: string }> = [
  { id: "all", label: "All" },
  { id: "long", label: "Long" },
  { id: "short", label: "Short" },
]

const Chip = ({
  pressed,
  label,
  onClick,
}: {
  pressed: boolean
  label: string
  onClick: () => void
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={pressed}
    className={`rounded-full px-3 py-1.5 font-display text-xs font-bold ${pressed ? "bg-teal text-ink" : "border border-line text-muted"}`}
  >
    {label}
  </button>
)

export default function TradersPage() {
  const [traders, setTraders] = useState<Trader[] | null>(null)
  const [error, setError] = useState("")
  const [sort, setSort] = useState<SortKey>("pnl7d")
  const [side, setSide] = useState<SideKey>("all")
  const [query, setQuery] = useState("")

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

  const stocks = useMemo(() => {
    const counts = new Map<string, number>()
    for (const trader of traders ?? []) {
      for (const position of trader.positions) {
        counts.set(position.label, (counts.get(position.label) ?? 0) + 1)
      }
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([label]) => label)
  }, [traders])

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const rows = (traders ?? []).filter((trader) => {
      const walletHit = needle ? trader.address.toLowerCase().includes(needle) || (trader.displayName ?? "").toLowerCase().includes(needle) : false
      const named = needle ? trader.positions.filter((position) => position.label.toLowerCase().includes(needle)) : trader.positions
      if (needle && !walletHit && !named.length) return false
      if (side === "all") return true
      const pool = needle && !walletHit ? named : trader.positions
      return pool.some((position) => position.side === side)
    })
    return [...rows].sort((a, b) => b[sort] - a[sort])
  }, [traders, sort, side, query])

  const filtering = sort !== "pnl7d" || side !== "all" || query.trim().length > 0

  const handleClear = () => {
    setSort("pnl7d")
    setSide("all")
    setQuery("")
  }

  const handleStock = (label: string) => {
    setQuery((current) => (current.trim().toUpperCase() === label ? "" : label))
  }

  const preview = (trader: Trader) => {
    const needle = query.trim().toLowerCase()
    const rank = (position: Trader["positions"][number]) => {
      const named = needle && position.label.toLowerCase().includes(needle) ? 2 : 0
      const sided = side !== "all" && position.side === side ? 1 : 0
      return named + sided
    }
    return [...trader.positions].sort((a, b) => rank(b) - rank(a) || b.positionValue - a.positionValue).slice(0, 2)
  }

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
      {traders && traders.length ? (
        <div className="mt-6">
          <div className="flex flex-wrap items-center gap-2">
            <p className="w-full text-xs text-muted sm:w-auto">Sort</p>
            {sorts.map((item) => (
              <Chip key={item.id} pressed={sort === item.id} label={item.label} onClick={() => setSort(item.id)} />
            ))}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <p className="w-full text-xs text-muted sm:w-auto">Side</p>
            {sides.map((item) => (
              <Chip key={item.id} pressed={side === item.id} label={item.label} onClick={() => setSide(item.id)} />
            ))}
          </div>
          <label className="mt-4 block text-xs text-muted" htmlFor="trader-search">Search a stock or a wallet</label>
          <input
            id="trader-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="NVDA or 0x"
            className="mt-1 w-full rounded-card border border-line bg-black px-3 py-3 font-display text-paper"
            autoComplete="off"
            spellCheck={false}
          />
          <div className="mt-3 flex flex-wrap gap-2" aria-label="Popular stocks">
            {stocks.map((label) => (
              <Chip key={label} pressed={query.trim().toUpperCase() === label} label={label} onClick={() => handleStock(label)} />
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between gap-3 text-xs text-muted">
            <p>{filtering ? `${visible.length} of ${traders.length} traders` : `${traders.length} traders`}</p>
            {filtering ? (
              <button type="button" onClick={handleClear} className="font-display text-xs font-bold text-teal">
                Clear filters
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
      {traders && traders.length && !visible.length ? (
        <p className="mt-6 rounded-card border border-line p-6 text-sm leading-relaxed text-muted">No traders match these filters. Clear them to see the full board.</p>
      ) : null}
      <div className={`mt-6 space-y-3 ${traders ? "motion-safe:animate-settle" : ""}`}>
        {visible.map((trader, index) => (
          <article key={trader.address} className="rounded-card border border-line p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-mono text-sm">{shortAddr(trader.address)}</p>
                <p className="mt-1 text-xs text-muted">#{index + 1}, account ${usd(trader.accountValue)}, {trader.positions.length} open{trader.joined > 0 ? `, ${trader.joined} joined` : ""}</p>
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
              {preview(trader).map((position) => (
                <li key={position.coin} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span>
                    <span className={position.side === "long" ? "text-teal" : "text-down"}>{position.side === "long" ? "Long" : "Short"}</span>
                    {" "}{position.label}
                  </span>
                  <span className="font-mono text-xs text-muted">{sz(position.size)}, {position.leverage}x, ${usd(position.positionValue)}</span>
                </li>
              ))}
              {trader.positions.length > 2 ? (
                <li className="text-xs text-muted">{trader.positions.length - 2} more positions</li>
              ) : null}
            </ul>
          </article>
        ))}
      </div>
    </section>
  )
}

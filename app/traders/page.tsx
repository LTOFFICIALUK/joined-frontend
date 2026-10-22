"use client"

import Link from "next/link"
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { ApiDown, Skeleton } from "@/components/brand/Skeleton"
import { TickerLink } from "@/components/markets/TickerLink"
import { Avatar } from "@/components/traders/Avatar"
import { PnlLine } from "@/components/traders/PnlLine"
import { api, type Trader } from "@/lib/api"
import { readBoard, writeBoard } from "@/lib/boardCache"
import { compactUsd, signedUsd, usd } from "@/lib/format"
import { copyScore, leadPosition, marketNote, maxLeverageOf, monthStats, nicknameFor, riskOf, withNames } from "@/lib/traderStyle"

type SortKey = "score" | "pnl30d" | "pnl7d" | "accountValue"
type SideKey = "all" | "long" | "short"

const sorts: Array<{ id: SortKey; label: string }> = [
  { id: "score", label: "Best" },
  { id: "pnl30d", label: "30 day" },
  { id: "pnl7d", label: "7 day" },
  { id: "accountValue", label: "Account" },
]

const sides: Array<{ id: SideKey; label: string }> = [
  { id: "all", label: "All" },
  { id: "long", label: "Long" },
  { id: "short", label: "Short" },
]

const levCaps = [
  { id: 0, label: "Any leverage" },
  { id: 5, label: "5x and under" },
  { id: 10, label: "10x and under" },
  { id: 25, label: "25x and under" },
]

const accounts = [
  { id: 0, label: "Any size" },
  { id: 100_000, label: "$100K and up" },
  { id: 1_000_000, label: "$1M and up" },
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

const riskClass = (risk: string) => {
  if (risk === "High") return "text-down"
  if (risk === "Medium") return "text-paper"
  return "text-teal"
}

export default function TradersPage() {
  const [traders, setTraders] = useState<Trader[] | null>(null)
  const [error, setError] = useState("")
  const [sort, setSort] = useState<SortKey>("score")
  const [side, setSide] = useState<SideKey>("all")
  const [query, setQuery] = useState("")
  const [both, setBoth] = useState(false)
  const [levCap, setLevCap] = useState(0)
  const [minAccount, setMinAccount] = useState(0)
  const [open, setOpen] = useState("")
  const [fetchedAt, setFetchedAt] = useState<number | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const [attempt, setAttempt] = useState(0)
  const held = useRef<Trader[]>([])

  useLayoutEffect(() => {
    const cached = readBoard()
    if (cached?.length) {
      const named = withNames(cached)
      held.current = named
      setTraders(named)
    }
  }, [])

  useEffect(() => {
    const clock = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(clock)
  }, [])

  useEffect(() => {
    let stop = false
    const load = async () => {
      try {
        const data = await api.traders()
        if (!stop) {
          const named = withNames(data.traders)
          if (held.current.length > 8 && named.length < held.current.length * 0.6) {
            setFetchedAt(Date.now())
            return
          }
          held.current = named
          writeBoard(named)
          setTraders(named)
          setFetchedAt(Date.now())
          setError("")
        }
      } catch (err) {
        if (!stop && !held.current.length) setError(err instanceof Error ? err.message : "Could not reach joined.fun")
      }
    }
    void load()
    const timer = window.setInterval(() => void load(), 8000)
    return () => {
      stop = true
      window.clearInterval(timer)
    }
  }, [attempt])

  const stocks = useMemo(() => {
    const counts = new Map<string, number>()
    for (const trader of traders ?? []) {
      for (const position of trader.positions) counts.set(position.label, (counts.get(position.label) ?? 0) + 1)
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([label]) => label)
  }, [traders])

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const rows = (traders ?? []).filter((trader) => {
      const walletHit = needle ? trader.address.toLowerCase().includes(needle) || nicknameFor(trader).toLowerCase().includes(needle) : false
      const named = needle ? trader.positions.filter((position) => position.label.toLowerCase().includes(needle)) : trader.positions
      if (needle && !walletHit && !named.length) return false
      if (both && !(trader.pnl7d > 0 && trader.pnl30d > 0)) return false
      if (minAccount && trader.accountValue < minAccount) return false
      if (levCap && maxLeverageOf(trader) > levCap) return false
      if (side === "all") return true
      const pool = needle && !walletHit ? named : trader.positions
      return pool.some((position) => position.side === side)
    })
    const value = (trader: Trader) => (sort === "score" ? copyScore(trader) : trader[sort])
    return [...rows].sort((a, b) => value(b) - value(a))
  }, [traders, sort, side, query, both, levCap, minAccount])

  const filtering = sort !== "score" || side !== "all" || query.trim().length > 0 || both || levCap > 0 || minAccount > 0
  const ago = fetchedAt === null ? null : Math.max(0, Math.round((now - fetchedAt) / 1000))

  const handleClear = () => {
    setSort("score")
    setSide("all")
    setQuery("")
    setBoth(false)
    setLevCap(0)
    setMinAccount(0)
  }

  const handleToggle = (address: string) => {
    setOpen((current) => (current === address ? "" : address))
  }

  return (
    <section>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-extrabold">Traders</h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">Ranked by 30 day P&L, how often the month went up, and the biggest drop. 30 day is the number on the row.</p>
        </div>
        <div className="mb-1 text-right text-xs text-muted">
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-teal shadow-[0_0_12px_rgba(80,210,193,0.9)]" />
            Live
          </span>
          <p className="mt-1">{ago === null ? "Updating" : `Updated ${ago}s ago`}</p>
        </div>
      </div>
      <p className="mt-3 text-xs text-muted">{marketNote(new Date(now))}</p>
      {error ? <div className="mt-6"><ApiDown message={error} onRetry={() => setAttempt((value) => value + 1)} /></div> : null}
      {traders && !traders.length && !error ? (
        <p className="mt-8 rounded-card border border-line p-6 text-sm leading-relaxed text-muted">No open stock positions on the leaderboard right now. When a top wallet has an open Hyperliquid stock perp, it shows up here with 30 day P&L and a Join button.</p>
      ) : null}
      {traders === null && !error ? <div className="mt-6 space-y-3"><Skeleton /><Skeleton /><Skeleton /></div> : null}
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
            <Chip pressed={both} label="Up this week and this month" onClick={() => setBoth((current) => !current)} />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <p className="w-full text-xs text-muted sm:w-auto">Max leverage</p>
            {levCaps.map((item) => (
              <Chip key={item.id} pressed={levCap === item.id} label={item.label} onClick={() => setLevCap(item.id)} />
            ))}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <p className="w-full text-xs text-muted sm:w-auto">Minimum account</p>
            {accounts.map((item) => (
              <Chip key={item.id} pressed={minAccount === item.id} label={item.label} onClick={() => setMinAccount(item.id)} />
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
              <Link key={label} href={`/markets/${label}`} className="rounded-full border border-line px-3 py-1.5 font-display text-xs font-bold text-teal">
                {label}
              </Link>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between gap-3 text-xs text-muted">
            <p>{filtering ? `${visible.length} of ${traders.length} traders` : `${traders.length} traders`}</p>
            {filtering ? (
              <button type="button" onClick={handleClear} className="font-display text-xs font-bold text-teal">Clear filters</button>
            ) : null}
          </div>
        </div>
      ) : null}
      {traders && traders.length && !visible.length ? (
        <p className="mt-6 rounded-card border border-line p-6 text-sm leading-relaxed text-muted">No traders match these filters. Clear them to see the full board.</p>
      ) : null}
      <div className="mt-4 divide-y divide-line overflow-hidden rounded-card border border-line">
        {visible.map((trader, index) => {
          const lead = leadPosition(trader)
          const risk = riskOf(trader)
          const stats = monthStats(trader.pnl30Series)
          const win = trader.winRate ?? stats.winRate
          const drop = trader.maxDrop ?? stats.maxDrop
          const expanded = open === trader.address
          return (
            <article key={trader.address}>
              <div className="flex items-center gap-3 px-3 py-3">
                <button
                  type="button"
                  onClick={() => handleToggle(trader.address)}
                  aria-expanded={expanded}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <Avatar address={trader.address} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="truncate font-display text-sm font-bold">{nicknameFor(trader)}</span>
                      <span className={`font-display text-sm font-extrabold ${trader.pnl30d >= 0 ? "text-teal" : "text-down"}`}>{signedUsd(trader.pnl30d)}</span>
                    </span>
                    <span className="mt-0.5 flex items-center justify-between gap-3 text-[11px] text-muted">
                      <span className="truncate font-mono">{trader.address.slice(0, 6)}…{trader.address.slice(-4)}</span>
                      <span>30 day</span>
                    </span>
                    <span className="mt-1 flex items-center justify-between gap-3 text-xs">
                      <span className="truncate">
                        <span className={`font-display font-bold ${riskClass(risk)}`}>{risk}</span>
                        {lead ? <span className="text-muted"> · {compactUsd(lead.positionValue)} {lead.side} {lead.label} · {lead.leverage}x</span> : null}
                      </span>
                      <span className="text-[11px] text-muted">#{index + 1}</span>
                    </span>
                  </span>
                </button>
                <div className="w-14 shrink-0">
                  <PnlLine points={trader.pnl30Series} bare />
                </div>
                <Link href={`/traders/${trader.address}`} className="shrink-0 rounded-full bg-teal px-3 py-2 font-display text-xs font-bold text-ink">
                  Join
                </Link>
              </div>
              {expanded ? (
                <div className="border-t border-line px-3 py-3 sm:pl-14">
                  <div className="sm:hidden">
                    <PnlLine points={trader.pnl30Series} />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:mt-0">
                    <p><span className="block text-xs text-muted">7 day P&L</span><span className={trader.pnl7d >= 0 ? "text-teal" : "text-down"}>{signedUsd(trader.pnl7d)}</span></p>
                    <p><span className="block text-xs text-muted">Account</span>{compactUsd(trader.accountValue)}</p>
                    <p><span className="block text-xs text-muted">Win rate</span>{Math.round(win * 100)}%</p>
                    <p><span className="block text-xs text-muted">Biggest drop</span>{compactUsd(drop)}</p>
                  </div>
                  <p className="mt-2 text-xs text-muted">{trader.joined > 0 ? `${trader.joined} joined` : "Be the first to join"}</p>
                  <ul className="mt-3 space-y-1">
                    {trader.positions.slice(0, 5).map((position) => (
                      <li key={position.coin} className="text-sm text-muted">{compactUsd(position.positionValue)} {position.side} <TickerLink label={position.label} /> · {position.leverage}x</li>
                    ))}
                    {trader.positions.length > 5 ? <li className="text-xs text-muted">{trader.positions.length - 5} more positions</li> : null}
                  </ul>
                  <p className="mt-2 text-xs text-muted">Risk {risk}. Equity ${usd(trader.accountValue)} against open notional.</p>
                </div>
              ) : null}
            </article>
          )
        })}
      </div>
    </section>
  )
}

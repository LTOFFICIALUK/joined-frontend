"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ApiDown, Skeleton } from "@/components/brand/Skeleton"
import { TickerLink } from "@/components/markets/TickerLink"
import { Avatar } from "@/components/traders/Avatar"
import { api, type TapePrint } from "@/lib/api"
import { compactUsd, when } from "@/lib/format"
import { useTape } from "@/lib/stream"
import { tradeMove } from "@/lib/traderStyle"

export const LiveBoard = ({ initial }: { initial: TapePrint[] | null }) => {
  const [rows, setRows] = useState<TapePrint[] | null>(initial)
  const [error, setError] = useState(initial ? "" : "Could not reach joined.fun")
  const [paused, setPaused] = useState(false)
  const [market, setMarket] = useState("all")
  const [side, setSide] = useState("all")
  const [attempt, setAttempt] = useState(0)
  const seen = useRef(Boolean(initial?.length))

  const applyRows = useCallback((next: TapePrint[]) => {
    setRows((current) => {
      if (paused && current) return current
      const byKey = new Map<string, TapePrint>()
      for (const row of [...next, ...(current ?? [])]) {
        const key = `${row.address}-${row.label}-${row.time}-${row.side}-${row.size}`
        if (!byKey.has(key)) byKey.set(key, row)
      }
      return [...byKey.values()].sort((a, b) => b.time - a.time).slice(0, 80)
    })
    seen.current = true
    setError("")
  }, [paused])

  useTape(applyRows, !paused)

  useEffect(() => {
    if (attempt === 0) return
    let stop = false
    const load = async () => {
      try {
        const data = await api.tape()
        if (!stop) applyRows(data.tape)
      } catch (err) {
        if (!stop && !seen.current) setError(err instanceof Error ? err.message : "Could not reach joined.fun")
      }
    }
    void load()
    return () => {
      stop = true
    }
  }, [applyRows, attempt])

  const markets = useMemo(() => [...new Set((rows ?? []).map((row) => row.label))], [rows])
  const visible = (rows ?? []).filter((row) => (market === "all" || row.label === market) && (side === "all" || row.side === side))

  return (
    <section className="min-w-0">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-4xl font-extrabold">Live</h1>
        <span className="inline-flex items-center gap-2 text-sm text-muted">
          <span className={`h-2 w-2 rounded-full ${paused ? "bg-muted" : "animate-pulse bg-teal"}`} aria-hidden="true" />
          {paused ? "Paused" : "Streaming"}
        </span>
      </div>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">New stock trades from the wallets on the board.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => setPaused((value) => !value)} className="rounded-full border border-line px-3 py-1.5 font-display text-xs font-bold">
          {paused ? "Resume" : "Pause"}
        </button>
        <label className="sr-only" htmlFor="live-market">Market</label>
        <select id="live-market" value={market} onChange={(event) => setMarket(event.target.value)} className="rounded-full border border-line bg-black px-3 py-1.5 text-sm">
          <option value="all">All markets</option>
          {markets.map((label) => <option key={label} value={label}>{label}</option>)}
        </select>
        <label className="sr-only" htmlFor="live-side">Side</label>
        <select id="live-side" value={side} onChange={(event) => setSide(event.target.value)} className="rounded-full border border-line bg-black px-3 py-1.5 text-sm">
          <option value="all">Both sides</option>
          <option value="long">Long</option>
          <option value="short">Short</option>
        </select>
      </div>
      {error ? <div className="mt-6"><ApiDown message={error} onRetry={() => setAttempt((value) => value + 1)} /></div> : null}
      {rows === null && !error ? <div className="mt-6 space-y-3"><Skeleton /><Skeleton /><Skeleton /></div> : null}
      {rows && !visible.length && !error ? <p className="mt-6 text-sm text-muted">The first trade from these wallets lands here.</p> : null}
      <ul className="mt-4 space-y-3">
        {visible.map((row) => (
          <li key={`${row.address}-${row.label}-${row.time}-${row.size}`} className="flex items-center gap-3 text-sm">
            <Avatar address={row.address} />
            <div className="min-w-0 flex-1">
              <Link href={`/traders/${row.address}`} className="font-display text-sm font-bold">{row.nickname || "Trader"}</Link>
              <p className="text-muted">
                {tradeMove(row.dir ?? "", row.side)} <TickerLink label={row.label} /> {row.side === "long" ? "Long" : "Short"} {compactUsd(row.size * row.price)}
                {typeof row.leverage === "number" ? ` · ${row.leverage}x` : ""}
              </p>
            </div>
            <span className="shrink-0 text-xs text-muted">{when(row.time)}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

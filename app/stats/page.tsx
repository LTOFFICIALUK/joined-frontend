"use client"

import { useEffect, useState } from "react"
import { ApiDown, Skeleton } from "@/components/brand/Skeleton"
import { TickerLink } from "@/components/markets/TickerLink"
import { api, type SiteStats } from "@/lib/api"
import { compactUsd, when } from "@/lib/format"

const actionWord = (value: string) => {
  if (value === "open") return "Opened"
  if (value === "add") return "Added"
  if (value === "reduce") return "Cut"
  if (value === "close") return "Closed"
  return "Updated"
}

export default function StatsPage() {
  const [stats, setStats] = useState<SiteStats | null>(null)
  const [error, setError] = useState("")
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let stop = false
    const load = async () => {
      try {
        const data = await api.stats()
        if (stop) return
        setStats(data.stats)
        setError("")
      } catch (err) {
        if (!stop) setError(err instanceof Error ? err.message : "Could not reach joined.fun")
      }
    }
    void load()
    return () => {
      stop = true
    }
  }, [attempt])

  return (
    <section>
      <h1 className="font-display text-4xl font-extrabold">Stats</h1>
      <p className="mt-2 text-sm text-muted">Joins, copied size, and the newest copied trades.</p>
      {error ? <div className="mt-6"><ApiDown message={error} onRetry={() => setAttempt((value) => value + 1)} /></div> : null}
      {!stats && !error ? <div className="mt-6 grid grid-cols-2 gap-3"><Skeleton /><Skeleton /><Skeleton /><Skeleton /></div> : null}
      {stats ? (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <p className="rounded-card border border-line p-3 text-sm"><span className="block text-xs text-muted">Wallets joined</span>{stats.walletsJoined > 0 ? stats.walletsJoined : "Be the first to join"}</p>
            <p className="rounded-card border border-line p-3 text-sm"><span className="block text-xs text-muted">Copied value</span>{stats.copiedUsd > 0 ? compactUsd(stats.copiedUsd) : "The first copy lands here"}</p>
            <p className="rounded-card border border-line p-3 text-sm"><span className="block text-xs text-muted">Copied trades</span>{stats.copiedTrades > 0 ? stats.copiedTrades : "The first copy lands here"}</p>
            <p className="rounded-card border border-line p-3 text-sm"><span className="block text-xs text-muted">Deposits</span>{stats.depositsUsd > 0 ? compactUsd(stats.depositsUsd) : "The first deposit lands here"}</p>
          </div>
          <h2 className="mt-8 font-display text-xl font-bold">Newest copies</h2>
          {stats.recent.length ? (
            <ul className="mt-3 space-y-3">
              {stats.recent.map((row) => {
                const label = row.coin.split(":").pop() || row.coin
                return (
                  <li key={row.id} className="text-sm">
                    <span>{actionWord(row.traderAction)} </span>
                    <TickerLink label={label} />
                    <span className="text-muted"> · {when(new Date(row.createdAt).getTime())}</span>
                    {row.evmAddress ? (
                      <a className="ml-2 font-mono text-xs text-teal" href={`https://app.hyperliquid.xyz/explorer/address/${row.evmAddress}`} target="_blank" rel="noreferrer">Account</a>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          ) : <p className="mt-3 text-sm text-muted">The first copy lands here.</p>}
        </>
      ) : null}
    </section>
  )
}

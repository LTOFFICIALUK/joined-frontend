"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ApiDown, Skeleton } from "@/components/brand/Skeleton"
import { api, type BoardMarket } from "@/lib/api"
import { compactUsd } from "@/lib/format"

export default function MarketsPage() {
  const [rows, setRows] = useState<BoardMarket[] | null>(null)
  const [error, setError] = useState("")
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let stop = false
    const load = async () => {
      try {
        const data = await api.boardMarkets()
        if (stop) return
        setRows(data.markets)
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
    <section className="min-w-0">
      <h1 className="font-display text-4xl font-extrabold">Markets</h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">Stock perps the top wallets hold, split by dollars and by wallets.</p>
      {error ? <div className="mt-6"><ApiDown message={error} onRetry={() => setAttempt((value) => value + 1)} /></div> : null}
      {rows === null && !error ? (
        <div className="mt-6 space-y-3">
          <Skeleton />
          <Skeleton />
          <Skeleton />
        </div>
      ) : null}
      {rows && !rows.length && !error ? <p className="mt-6 text-sm text-muted">No open stock positions on the board right now.</p> : null}
      <div className="mt-6 min-w-0 overflow-x-auto rounded-card border border-line">
        {rows?.length ? (
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-xs text-muted">
              <tr>
                <th className="px-3 py-2 font-medium">Market</th>
                <th className="px-3 py-2 font-medium">Long $</th>
                <th className="px-3 py-2 font-medium">Short $</th>
                <th className="px-3 py-2 font-medium">Long wallets</th>
                <th className="px-3 py-2 font-medium">Short wallets</th>
                <th className="px-3 py-2 font-medium">Biggest</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="border-t border-line">
                  <td className="px-3 py-2"><Link href={`/markets/${row.label}`} className="font-display font-bold text-teal">{row.label}</Link></td>
                  <td className="px-3 py-2">{compactUsd(row.longUsd)}</td>
                  <td className="px-3 py-2">{compactUsd(row.shortUsd)}</td>
                  <td className="px-3 py-2">{row.longWallets}</td>
                  <td className="px-3 py-2">{row.shortWallets}</td>
                  <td className="px-3 py-2">{compactUsd(row.biggestUsd)} {row.biggestSide}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>
    </section>
  )
}

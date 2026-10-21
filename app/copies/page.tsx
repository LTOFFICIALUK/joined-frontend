"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useSession } from "@/app/providers"
import { api, type JoinRow } from "@/lib/api"
import { shortAddr, signedUsd, sz, usd } from "@/lib/format"

export default function CopiesPage() {
  const { session, ready, connect } = useSession()
  const [rows, setRows] = useState<JoinRow[] | null>(null)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState("")

  useEffect(() => {
    if (!ready) return
    if (!session) {
      setRows([])
      return
    }
    let stop = false
    const load = async () => {
      try {
        const data = await api.joins()
        if (!stop) {
          setRows(data.joins)
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
  }, [ready, session])

  const handleStop = async (id: string) => {
    setBusy(id)
    try {
      await api.stopJoin(id)
      setRows((current) => (current ?? []).filter((row) => row.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not stop")
    } finally {
      setBusy("")
    }
  }

  const handleClose = async (id: string) => {
    setBusy(id)
    try {
      await api.closeJoin(id)
      setRows((current) => (current ?? []).filter((row) => row.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not close")
    } finally {
      setBusy("")
    }
  }

  return (
    <section>
      <h1 className="font-display text-4xl font-extrabold">My copies</h1>
      <p className="mt-2 max-w-xl text-sm text-muted">Active joins and the positions copied onto your Hyperliquid account.</p>
      {!session && ready ? (
        <div className="mt-8 rounded-card border border-line p-6">
          <p className="text-sm text-muted">Connect Phantom to see the traders you joined.</p>
          <button type="button" onClick={() => void connect()} className="mt-4 rounded-full bg-teal px-4 py-2 font-display text-sm font-bold text-ink">Connect Phantom</button>
        </div>
      ) : null}
      {error ? <p className="mt-6 text-sm text-down">{error}</p> : null}
      {session && rows && !rows.length ? (
        <p className="mt-8 rounded-card border border-line p-6 text-sm text-muted">
          No active copies. Pick a trader and your copied stock positions will show up here. <Link href="/traders" className="text-teal">Find a trader</Link>
        </p>
      ) : null}
      <div className="mt-6 space-y-4">
        {rows?.map((row) => (
          <article key={row.id} className="rounded-card border border-line p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Link href={`/traders/${row.trader}`} className="font-mono text-sm">{shortAddr(row.trader)}</Link>
                <p className="mt-1 text-xs text-muted">Size ${usd(row.sizeUsd)}{row.traderPnl7d === null ? "" : `, trader 7 day ${signedUsd(row.traderPnl7d)}`}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" disabled={busy === row.id} onClick={() => void handleStop(row.id)} className="rounded-full border border-line px-3 py-2 font-display text-xs font-bold">Stop</button>
                <button type="button" disabled={busy === row.id} onClick={() => void handleClose(row.id)} className="rounded-full bg-teal px-3 py-2 font-display text-xs font-bold text-ink">Stop and close</button>
              </div>
            </div>
            {row.positions.length ? (
              <ul className="mt-4 space-y-2">
                {row.positions.map((position) => (
                  <li key={position.coin} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span>
                      <span className={position.side === "long" ? "text-teal" : "text-down"}>{position.side === "long" ? "Long" : "Short"}</span>
                      {" "}{position.label}
                    </span>
                    <span className={`font-display font-bold ${position.unrealizedPnl >= 0 ? "text-teal" : "text-down"}`}>{signedUsd(position.unrealizedPnl)}</span>
                    <span className="font-mono text-xs text-muted">{sz(position.size)}, {position.leverage}x</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-muted">Copied positions show up here after this trader opens, adds, reduces, or closes a stock perp.</p>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}

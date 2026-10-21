"use client"

import { useEffect, useState } from "react"
import { useSession } from "@/app/providers"
import { api, type LiveAccount, type Market } from "@/lib/api"
import { px, signedUsd, sz, usd } from "@/lib/format"

export default function PositionsPage() {
  const { session, ready, connect } = useSession()
  const [live, setLive] = useState<LiveAccount | null>(null)
  const [markets, setMarkets] = useState<Market[]>([])
  const [error, setError] = useState("")
  const [busy, setBusy] = useState("")

  useEffect(() => {
    if (!ready || !session) return
    let stop = false
    const load = async () => {
      try {
        const [account, listed] = await Promise.all([api.live(), api.markets()])
        if (!stop) {
          setLive(account)
          setMarkets(listed.markets)
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

  const handleClose = async (position: LiveAccount["positions"][number]) => {
    const market = markets.find((row) => row.coin === position.coin)
    const mark = market?.markPx || position.entryPx
    if (!(mark > 0)) {
      setError("Mark price is unavailable")
      return
    }
    setBusy(position.coin)
    try {
      await api.liveOrder({
        coin: position.coin,
        side: position.side === "long" ? "short" : "long",
        type: "market",
        size: position.size,
        mark,
        leverage: position.leverage || 1,
        reduce: true,
      })
      setLive(await api.live())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not close")
    } finally {
      setBusy("")
    }
  }

  return (
    <section>
      <h1 className="font-display text-4xl font-extrabold">Positions</h1>
      <p className="mt-2 max-w-xl text-sm text-muted">Stock perps on your Hyperliquid account.</p>
      {!session && ready ? (
        <div className="mt-8 rounded-card border border-line p-6">
          <p className="text-sm text-muted">Connect Phantom to see positions.</p>
          <button type="button" onClick={() => void connect()} className="mt-4 rounded-full bg-teal px-4 py-2 font-display text-sm font-bold text-ink">Connect Phantom</button>
        </div>
      ) : null}
      {live ? (
        <p className="mt-4 text-sm text-muted">Equity ${usd(live.equityUsd)}. Withdrawable ${usd(live.withdrawableUsd)}.</p>
      ) : null}
      {error ? <p className="mt-4 text-sm text-down">{error}</p> : null}
      {session && live && !live.positions.length ? (
        <p className="mt-8 rounded-card border border-line p-6 text-sm text-muted">Open stock positions from the traders you join will show up here.</p>
      ) : null}
      <div className="mt-6 space-y-3">
        {live?.positions.map((position) => (
          <article key={position.id} className="rounded-card border border-line p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-display text-lg font-bold">{position.label}</p>
                <p className={position.side === "long" ? "text-sm text-teal" : "text-sm text-down"}>{position.side === "long" ? "Long" : "Short"}, {position.leverage}x</p>
              </div>
              <p className={`font-display text-2xl font-extrabold ${position.unrealizedPnl >= 0 ? "text-teal" : "text-down"}`}>{signedUsd(position.unrealizedPnl)}</p>
            </div>
            <p className="mt-3 font-mono text-xs text-muted">Size {sz(position.size)}. Entry ${px(position.entryPx)}. Value ${usd(position.positionValue)}.</p>
            <button
              type="button"
              disabled={busy === position.coin}
              onClick={() => void handleClose(position)}
              className="mt-4 rounded-full border border-line px-4 py-2 font-display text-xs font-bold"
            >
              {busy === position.coin ? "Closing" : "Close"}
            </button>
          </article>
        ))}
      </div>
    </section>
  )
}

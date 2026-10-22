"use client"

import { useEffect, useState } from "react"
import { useSession } from "@/app/providers"
import Link from "next/link"
import { Hold } from "@/components/brand/Hold"
import { EmptyGuide } from "@/components/shell/EmptyGuide"
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
        <EmptyGuide
          title="No positions yet"
          body="These are the stock perps on your own Hyperliquid account, including the ones joined copies for you."
          steps={[
            "Connect Phantom.",
            "Send SOL from Funds. It lands as USDC.",
            "Join a trader. New stock trades show up here with live P&L.",
          ]}
          action={(
            <>
              <button type="button" onClick={() => void connect()} className="rounded-full bg-teal px-4 py-2 font-display text-sm font-bold text-ink">Connect Phantom</button>
              <Link href="/funds" className="rounded-full border border-line px-4 py-2 font-display text-sm font-bold">Open Funds</Link>
            </>
          )}
        />
      ) : null}
      {(!ready || (session && !live && !error)) ? <Hold /> : null}
      {live ? (
        <p className="mt-4 text-sm text-muted">Equity ${usd(live.equityUsd)}. Withdrawable ${usd(live.withdrawableUsd)}.</p>
      ) : null}
      {error ? <p className="mt-4 text-sm text-down">{error}</p> : null}
      {session && live && !live.positions.length ? (
        <EmptyGuide
          title={live.equityUsd > 0 ? "No open stock positions" : "Nothing open yet"}
          body={live.equityUsd > 0
            ? "When a trader you joined opens, adds, reduces, or closes a stock perp, the matching position shows up here."
            : "USDC has to land before a copied trade can open. Deposit on Funds, then join a trader."}
          steps={[
            "Check Funds for equity and anything still on the way.",
            "Join a trader from the next stock trade. The current book is not copied.",
            "Close here sends a reduce order for that position.",
          ]}
          action={<Link href={live.equityUsd > 0 ? "/traders" : "/funds"} className="rounded-full bg-teal px-4 py-2 font-display text-sm font-bold text-ink">{live.equityUsd > 0 ? "Find a trader" : "Deposit on Funds"}</Link>}
        />
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

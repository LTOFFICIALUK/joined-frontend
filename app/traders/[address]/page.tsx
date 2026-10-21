"use client"

import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { PnlLine } from "@/components/traders/PnlLine"
import { useSession } from "@/app/providers"
import { api, getToken, type Trader, type TraderFill } from "@/lib/api"
import { px, shortAddr, signedUsd, sz, usd } from "@/lib/format"

const presets = [100, 250, 500, 1000]

export default function TraderPage() {
  const params = useParams<{ address: string }>()
  const address = params.address
  const { session, connect, hint } = useSession()
  const [trader, setTrader] = useState<Trader | null>(null)
  const [fills, setFills] = useState<TraderFill[]>([])
  const [error, setError] = useState("")
  const [preset, setPreset] = useState(250)
  const [custom, setCustom] = useState("")
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState("")

  useEffect(() => {
    let stop = false
    const load = async () => {
      try {
        const data = await api.trader(address)
        if (!stop) {
          setTrader(data.trader)
          setFills(data.fills)
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
  }, [address])

  const size = custom.trim() ? Number(custom) : preset

  const handleJoin = async () => {
    if (!Number.isFinite(size) || size < 10) {
      setNote("Minimum join size is $10.")
      return
    }
    setBusy(true)
    setNote("")
    try {
      if (!session && !getToken()) {
        const ok = await connect()
        if (!ok || !getToken()) return
      }
      await api.join({ trader: address, sizeUsd: size })
      setNote("You are copying this trader. New stock trades will follow from here.")
    } catch (err) {
      setNote(err instanceof Error ? err.message : "Could not join")
    } finally {
      setBusy(false)
    }
  }

  if (error && !trader) {
    return <p className="text-sm text-down">{error}</p>
  }
  if (!trader) return <p className="text-sm text-muted">Loading this trader.</p>

  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div>
        <p className="font-mono text-sm text-muted">{trader.address}</p>
        <h1 className="mt-2 font-display text-4xl font-extrabold">{shortAddr(trader.address)}</h1>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-card border border-line p-4">
            <p className={`font-display text-3xl font-extrabold ${trader.pnl7d >= 0 ? "text-teal" : "text-down"}`}>{signedUsd(trader.pnl7d)}</p>
            <p className="mt-1 text-xs text-muted">7 day P&L</p>
          </div>
          <div className="rounded-card border border-line p-4">
            <p className={`font-display text-3xl font-extrabold ${trader.pnl30d >= 0 ? "text-teal" : "text-down"}`}>{signedUsd(trader.pnl30d)}</p>
            <p className="mt-1 text-xs text-muted">30 day P&L</p>
          </div>
        </div>
        <p className="mt-4 text-sm text-muted">Account ${usd(trader.accountValue)}. {trader.joined} joined.</p>
        <div className="mt-4 rounded-card border border-line p-4">
          <PnlLine points={trader.pnl30Series} />
        </div>
        <h2 className="mt-8 font-display text-xl font-bold">Open stock positions</h2>
        <ul className="mt-3 space-y-2">
          {trader.positions.length ? trader.positions.map((position) => (
            <li key={position.coin} className="rounded-card border border-line px-4 py-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-display font-bold">{position.label}</span>
                <span className={position.side === "long" ? "text-teal" : "text-down"}>{position.side === "long" ? "Long" : "Short"}</span>
              </div>
              <p className="mt-1 font-mono text-xs text-muted">{sz(position.size)} size, {position.leverage}x, ${usd(position.positionValue)}</p>
            </li>
          )) : (
            <li className="text-sm text-muted">No open stock positions right now.</li>
          )}
        </ul>
        <h2 className="mt-8 font-display text-xl font-bold">Recent fills</h2>
        {fills.length ? (
          <ul className="mt-3 space-y-2">
            {fills.map((fill) => (
              <li key={`${fill.id}-${fill.time}`} className="flex flex-wrap items-center justify-between gap-2 rounded-card border border-line px-4 py-3 text-sm">
                <span>{fill.label} <span className={fill.side === "long" ? "text-teal" : "text-down"}>{fill.side === "long" ? "Buy" : "Sell"}</span></span>
                <span className="font-mono text-xs text-muted">{sz(fill.size)} @ ${px(fill.price)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted">Recent stock fills will show up here.</p>
        )}
      </div>
      <aside className="h-fit rounded-card border border-line p-4 lg:sticky lg:top-4">
        <h2 className="font-display text-xl font-bold">Join</h2>
        <p className="mt-2 text-sm text-muted">Your size follows this trader from the next stock trade. Existing positions stay theirs.</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {presets.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setPreset(value)
                setCustom("")
              }}
              className={`rounded-full py-2 font-display text-sm font-bold ${!custom && preset === value ? "bg-teal text-ink" : "border border-line text-paper"}`}
            >
              {value === 1000 ? "$1K" : `$${value}`}
            </button>
          ))}
        </div>
        <label className="mt-3 block text-xs text-muted" htmlFor="custom-size">Custom size in USD</label>
        <input
          id="custom-size"
          inputMode="decimal"
          value={custom}
          onChange={(event) => setCustom(event.target.value)}
          placeholder="Custom"
          className="mt-1 w-full rounded-card border border-line bg-black px-3 py-3 font-display text-paper"
        />
        <button
          type="button"
          onClick={() => void handleJoin()}
          disabled={busy}
          className="mt-4 w-full rounded-full bg-teal py-3 font-display text-sm font-bold text-ink disabled:opacity-60"
        >
          {busy ? "Joining" : "Join with Phantom"}
        </button>
        {note || hint ? <p className="mt-3 text-sm text-paper">{note || hint}</p> : null}
      </aside>
    </section>
  )
}

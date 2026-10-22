"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useSession } from "@/app/providers"
import { Hold } from "@/components/brand/Hold"
import { EmptyGuide } from "@/components/shell/EmptyGuide"
import { api, type JoinRow } from "@/lib/api"
import { shortAddr, signedUsd, sz, usd } from "@/lib/format"

const actionWord = (value: string) => {
  if (value === "open") return "Opened"
  if (value === "add") return "Added"
  if (value === "reduce") return "Reduced"
  if (value === "close") return "Closed"
  return "Updated"
}

const actionLine = (action: JoinRow["actions"][number]) => {
  const name = action.coin.split(":").pop() || action.coin
  const word = actionWord(action.traderAction)
  if (action.status === "placed") return `${word} ${name}.`
  if (action.status === "skipped") return `${word} ${name}. Waiting until the copy reaches $10.`
  return `${word} ${name}. ${action.detail}`
}

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
        <EmptyGuide
          title="Nothing copied yet"
          body="This page lists every trader you join, the stock positions copied onto your account, and each action as it happens."
          steps={[
            "Connect Phantom. You sign a login message. It does not send funds.",
            "Pick a trader and a size. Copying starts from the next stock trade.",
            "Deposit SOL on Funds so those copies have USDC to trade.",
          ]}
          action={(
            <>
              <button type="button" onClick={() => void connect()} className="rounded-full bg-teal px-4 py-2 font-display text-sm font-bold text-ink">Connect Phantom</button>
              <Link href="/traders" className="rounded-full border border-line px-4 py-2 font-display text-sm font-bold">Find a trader</Link>
            </>
          )}
        />
      ) : null}
      {error ? <p className="mt-6 text-sm text-down">{error}</p> : null}
      {(!ready || (session && rows === null && !error)) ? <Hold /> : null}
      {session && rows && !rows.length ? (
        <EmptyGuide
          title="No active copies"
          body="Join a trader and the next stock trade is copied here, sized to the amount you pick. Existing positions stay on their book."
          steps={[
            "Open Traders and choose a wallet with open stock perps.",
            "Pick $100, $250, $500, $1K, or a custom size.",
            "Stop keeps the positions. Stop and close sends reduce orders for what was copied.",
          ]}
          action={<Link href="/traders" className="rounded-full bg-teal px-4 py-2 font-display text-sm font-bold text-ink">Find a trader</Link>}
        />
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
            {row.actions.length ? (
              <ul className="mt-3 space-y-1">
                {row.actions.map((action) => (
                  <li key={action.id} className="text-sm text-muted">{actionLine(action)}</li>
                ))}
              </ul>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  )
}

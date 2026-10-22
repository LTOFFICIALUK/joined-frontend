"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useSession } from "@/app/providers"
import { Hold } from "@/components/brand/Hold"
import { EmptyGuide } from "@/components/shell/EmptyGuide"
import { api, type JoinRow } from "@/lib/api"
import { compactUsd, shortAddr, signedUsd, sz, usd } from "@/lib/format"
import { useEmbedded } from "@/lib/embed"

const actionWord = (value: string) => {
  if (value === "open") return "Opened"
  if (value === "add") return "Added"
  if (value === "reduce") return "Reduced"
  if (value === "close") return "Closed"
  return "Updated"
}

export default function CopiesPage() {
  const embedded = useEmbedded()
  const { session, ready, connect } = useSession()
  const [rows, setRows] = useState<JoinRow[] | null>(null)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState("")
  const [account, setAccount] = useState("")
  const [ask, setAsk] = useState<{ id: string; kind: "pause" | "resume" | "size" | "cap" | "stop" | "close" } | null>(null)
  const [sizeDraft, setSizeDraft] = useState<Record<string, string>>({})
  const [capDraft, setCapDraft] = useState<Record<string, string>>({})

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
          const live = await api.live().catch(() => null)
          if (!stop && live) setAccount(live.address)
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

  const handleConfirm = async () => {
    if (!ask) return
    const row = (rows ?? []).find((item) => item.id === ask.id)
    if (!row) return
    setBusy(row.id)
    try {
      if (ask.kind === "pause") await api.pauseJoin(row.id)
      if (ask.kind === "resume") await api.resumeJoin(row.id)
      if (ask.kind === "size") await api.updateJoin(row.id, { sizeUsd: Number(sizeDraft[row.id] || row.sizeUsd) })
      if (ask.kind === "cap") {
        const next = capDraft[row.id] ?? ""
        await api.updateJoin(row.id, { maxLeverage: next === "" || next === "0" ? null : Number(next) })
      }
      if (ask.kind === "stop") await api.stopJoin(row.id)
      if (ask.kind === "close") await api.closeJoin(row.id)
      const data = await api.joins()
      setRows(data.joins)
      setAsk(null)
      setError("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the copy")
    } finally {
      setBusy("")
    }
  }

  const confirmLine = (kind: NonNullable<typeof ask>["kind"]) => {
    if (kind === "pause") return "Pause copying. Open positions stay. New trades wait until you resume."
    if (kind === "resume") return "Resume copying from the next stock trade."
    if (kind === "size") return "Change the size used for the next copy."
    if (kind === "cap") return "Change the highest leverage a copy will use."
    if (kind === "stop") return "Stop copying and keep the open positions."
    return "Stop copying and close every copied position."
  }

  return (
    <section>
      {embedded ? <h2 className="font-display text-2xl font-bold">Copies</h2> : <h1 className="font-display text-4xl font-extrabold">My copies</h1>}
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">Active joins and the positions copied onto your Hyperliquid account.</p>
      {!embedded && !session && ready ? (
        <EmptyGuide
          title="Nothing copied yet"
          body="This page lists every trader you join, the stock positions copied onto your account, and each action as it happens."
          steps={[
            "Connect Phantom. You sign a login message. It does not send funds.",
            "Pick a trader and a size. Copying starts from the next stock trade.",
            "Send SOL from the join button if the account is empty. It lands as USDC.",
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
        {rows?.map((row) => {
          const copyPnl = row.positions.reduce((sum, position) => sum + position.unrealizedPnl, 0)
          return (
          <article key={row.id} className="rounded-card border border-line p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <Link href={`/traders/${row.trader}`} className="font-display text-sm font-bold">{row.traderNickname || shortAddr(row.trader)}</Link>
                <p className="mt-1 text-xs text-muted">Size {compactUsd(row.sizeUsd)}{row.maxLeverage ? `, cap ${row.maxLeverage}x` : ""}{row.status === "paused" ? ", paused" : ""}</p>
                <p className="mt-1 text-sm">{row.positions.length ? <>Copy P&amp;L <span className={copyPnl >= 0 ? "text-teal" : "text-down"}>{signedUsd(copyPnl)}</span></> : "The first copy lands here"}</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={() => setAsk({ id: row.id, kind: row.status === "paused" ? "resume" : "pause" })} className="rounded-full border border-line px-3 py-2 font-display text-xs font-bold">{row.status === "paused" ? "Resume" : "Pause"}</button>
              <button type="button" onClick={() => setAsk({ id: row.id, kind: "stop" })} className="rounded-full border border-line px-3 py-2 font-display text-xs font-bold">Stop and keep positions</button>
              <button type="button" onClick={() => setAsk({ id: row.id, kind: "close" })} className="rounded-full bg-teal px-3 py-2 font-display text-xs font-bold text-ink">Stop and close all</button>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <label className="text-xs text-muted">
                New size
                <input value={sizeDraft[row.id] ?? ""} onChange={(event) => setSizeDraft((current) => ({ ...current, [row.id]: event.target.value }))} inputMode="decimal" placeholder={usd(row.sizeUsd)} className="mt-1 w-full rounded-card border border-line bg-black px-3 py-2 text-sm text-paper" />
              </label>
              <label className="text-xs text-muted">
                New cap
                <input value={capDraft[row.id] ?? ""} onChange={(event) => setCapDraft((current) => ({ ...current, [row.id]: event.target.value }))} inputMode="numeric" placeholder={row.maxLeverage ? `${row.maxLeverage}x` : "Max"} className="mt-1 w-full rounded-card border border-line bg-black px-3 py-2 text-sm text-paper" />
              </label>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <button type="button" onClick={() => setAsk({ id: row.id, kind: "size" })} className="font-display text-xs font-bold text-teal">Change size</button>
              <button type="button" onClick={() => setAsk({ id: row.id, kind: "cap" })} className="font-display text-xs font-bold text-teal">Change cap</button>
            </div>
            {ask?.id === row.id ? (
              <div className="mt-3 rounded-card border border-line p-3">
                <p className="text-sm">{confirmLine(ask.kind)}</p>
                <div className="mt-2 flex gap-2">
                  <button type="button" disabled={busy === row.id} onClick={() => void handleConfirm()} className="rounded-full bg-teal px-3 py-2 font-display text-xs font-bold text-ink">Confirm</button>
                  <button type="button" onClick={() => setAsk(null)} className="rounded-full border border-line px-3 py-2 font-display text-xs font-bold">Cancel</button>
                </div>
              </div>
            ) : null}
            {row.positions.length ? (
              <ul className="mt-4 space-y-2">
                {row.positions.map((position) => (
                  <li key={position.coin} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span>
                      <span className={position.side === "long" ? "text-teal" : "text-down"}>{position.side === "long" ? "Long" : "Short"}</span>
                      {" "}{position.label}
                    </span>
                    <span className={`font-display font-bold ${position.unrealizedPnl >= 0 ? "text-teal" : "text-down"}`}>{signedUsd(position.unrealizedPnl)}</span>
                    <span className="text-xs text-muted">{sz(position.size)} · {position.leverage}x</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-muted">The first copy lands here.</p>
            )}
            {row.actions.length ? (
              <ul className="mt-3 space-y-2">
                {row.actions.map((action) => (
                  <li key={action.id} className="text-sm text-muted">
                    {action.ourAction === "fail" || action.status === "fail" || action.status === "failed" ? (
                      <span>Trader {actionWord(action.traderAction).toLowerCase()} {action.coin.split(":").pop()}. {action.detail}</span>
                    ) : (
                      <span>Trader {actionWord(action.traderAction).toLowerCase()} {action.coin.split(":").pop()}. We {actionWord(action.ourAction).toLowerCase()}.</span>
                    )}
                    {action.status === "skipped" ? <span> Waiting until the copy reaches $10.</span> : null}
                    {account ? <a className="ml-2 font-mono text-xs text-teal" href={`https://app.hyperliquid.xyz/explorer/address/${account}`} target="_blank" rel="noreferrer">Hyperliquid</a> : null}
                  </li>
                ))}
              </ul>
            ) : null}
          </article>
          )
        })}
      </div>
    </section>
  )
}

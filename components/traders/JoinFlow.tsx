"use client"

import { useEffect, useState } from "react"
import { useSession } from "@/app/providers"
import { api, getToken, type FundPreview, type LiveAccount, type Trader } from "@/lib/api"
import { depositSol } from "@/lib/deposit"
import { usd } from "@/lib/format"
import { phantomError } from "@/lib/phantom"
import { followLine } from "@/lib/traderStyle"

const presets = [100, 250, 500, 1000]
const caps = [
  { id: 2, label: "2x" },
  { id: 5, label: "5x" },
  { id: 10, label: "10x" },
  { id: 0, label: "Max" },
]

export const JoinFlow = ({ trader, formId = "join", compact = false }: { trader: Trader; formId?: string; compact?: boolean }) => {
  const { session, connect, hint } = useSession()
  const [preset, setPreset] = useState(250)
  const [custom, setCustom] = useState("")
  const [cap, setCap] = useState(0)
  const [live, setLive] = useState<LiveAccount | null>(null)
  const [sol, setSol] = useState("1")
  const [preview, setPreview] = useState<FundPreview | null>(null)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState("")
  const [editing, setEditing] = useState(!compact)

  const sized = custom.trim() ? Number(custom) : preset
  const size = Number.isFinite(sized) ? sized : 0
  const leverageCap = cap > 0 ? cap : null
  const line = followLine(trader, size > 0 ? size : 250, leverageCap)
  const short = Boolean(session && live && live.withdrawableUsd + 1 < size)

  useEffect(() => {
    if (!session) {
      setLive(null)
      return
    }
    let stop = false
    void api.live().then((account) => {
      if (!stop) setLive(account)
    }).catch(() => undefined)
    return () => {
      stop = true
    }
  }, [session])

  useEffect(() => {
    if (!short) {
      setPreview(null)
      return
    }
    const value = Number(sol)
    if (!(value > 0)) {
      setPreview(null)
      return
    }
    const timer = window.setTimeout(() => {
      void api.livePreview({ side: "deposit", sol: value }).then(setPreview).catch(() => setPreview(null))
    }, 350)
    return () => window.clearTimeout(timer)
  }, [short, sol])

  const handleJoin = async () => {
    if (!(size >= 10)) {
      setNote("Minimum join size is $10.")
      return
    }
    setBusy(true)
    setNote("")
    try {
      if (!session && !getToken()) {
        const ok = await connect()
        if (!ok || !getToken()) return
        setNote("Phantom is connected. Send SOL if the account is empty, then confirm.")
        return
      }
      const account = await api.live()
      setLive(account)
      if (account.withdrawableUsd + 1 < size) {
        await depositSol(Number(sol), setNote)
        const next = await api.live()
        setLive(next)
        if (next.withdrawableUsd + 1 < size) {
          setNote("SOL is on the way. Confirm join once the USDC has landed.")
        }
        return
      }
      await api.join({ trader: trader.address, sizeUsd: size, maxLeverage: leverageCap })
      setNote("You are copying this trader. New stock trades will follow from here.")
    } catch (err) {
      setNote(phantomError(err))
    } finally {
      setBusy(false)
    }
  }

  const buttonLabel = busy
    ? "Waiting for Phantom"
    : !session
      ? "Connect Phantom"
      : short
        ? "Send SOL"
        : "Confirm join"

  return (
    <div>
      <h2 className="font-display text-xl font-bold">Join</h2>
      <p className="mt-2 text-sm text-paper">{line}</p>
      {compact && !editing ? (
        <button type="button" onClick={() => setEditing(true)} className="mt-3 text-xs font-display font-bold text-teal">
          Change size or leverage
        </button>
      ) : null}
      {editing ? (
        <>
          <div className="mt-3 grid grid-cols-4 gap-2">
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
          <label className="mt-3 block text-xs text-muted" htmlFor={`custom-size-${formId}`}>Custom size in USD</label>
          <input
            id={`custom-size-${formId}`}
            inputMode="decimal"
            value={custom}
            onChange={(event) => setCustom(event.target.value)}
            placeholder="Custom"
            className="mt-1 w-full rounded-card border border-line bg-black px-3 py-3 font-display text-paper"
          />
          <p className="mt-3 text-xs text-muted">Cap leverage</p>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {caps.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setCap(item.id)}
                aria-pressed={cap === item.id}
                className={`rounded-full py-2 font-display text-sm font-bold ${cap === item.id ? "bg-teal text-ink" : "border border-line text-paper"}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </>
      ) : null}
      {session && live ? (
        <p className="mt-3 text-xs text-muted">Free USDC ${usd(live.withdrawableUsd)}. This join uses {size >= 1000 ? `$${Math.round(size).toLocaleString("en-US")}` : `$${Math.round(size) || 0}`}.</p>
      ) : null}
      {short ? (
        <div className="mt-3">
          <label className="block text-xs text-muted" htmlFor={`sol-size-${formId}`}>SOL to send</label>
          <input
            id={`sol-size-${formId}`}
            inputMode="decimal"
            value={sol}
            onChange={(event) => setSol(event.target.value)}
            className="mt-1 w-full rounded-card border border-line bg-black px-3 py-3 font-display text-paper"
          />
          {preview ? <p className="mt-2 text-xs text-muted">Fee about ${usd(preview.feeUsd)}. You receive about ${usd(preview.receiveUsd)}.</p> : null}
        </div>
      ) : null}
      {!session ? <p className="mt-3 text-xs text-muted">Phantom asks you to sign a login message. It does not send funds.</p> : null}
      <button
        type="button"
        onClick={() => void handleJoin()}
        disabled={busy}
        className="mt-4 w-full rounded-full bg-teal py-3 font-display text-sm font-bold text-ink disabled:opacity-60"
      >
        {buttonLabel}
      </button>
      {note || hint ? <p className="mt-3 text-sm text-paper">{note || hint}</p> : null}
    </div>
  )
}

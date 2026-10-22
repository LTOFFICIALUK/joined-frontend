"use client"

import { useEffect, useState } from "react"
import { useSession } from "@/app/providers"
import { Hold } from "@/components/brand/Hold"
import { EmptyGuide } from "@/components/shell/EmptyGuide"
import { api, type ActivityRow, type FundPreview, type LiveAccount, type WithdrawProgress } from "@/lib/api"
import { depositSol } from "@/lib/deposit"
import { useEmbedded } from "@/lib/embed"
import { shortAddr, usd } from "@/lib/format"
import { phantomError } from "@/lib/phantom"

export default function FundsPage() {
  const embedded = useEmbedded()
  const { session, ready, connect } = useSession()
  const [live, setLive] = useState<LiveAccount | null>(null)
  const [tab, setTab] = useState<"deposit" | "withdraw">("deposit")
  const [amount, setAmount] = useState("1")
  const [preview, setPreview] = useState<FundPreview | null>(null)
  const [activity, setActivity] = useState<ActivityRow[]>([])
  const [message, setMessage] = useState("")
  const [busy, setBusy] = useState(false)
  const [track, setTrack] = useState<WithdrawProgress | null>(null)

  const refresh = async () => {
    const [account, history] = await Promise.all([api.live(), api.activity()])
    setLive(account)
    setActivity(history.activity)
  }

  useEffect(() => {
    if (!ready || !session) return
    void refresh().catch((err) => setMessage(err instanceof Error ? err.message : "Could not reach joined.fun"))
  }, [ready, session])

  useEffect(() => {
    if (!session) return
    const value = Number(amount)
    if (!(value > 0)) {
      setPreview(null)
      return
    }
    const timer = window.setTimeout(() => {
      void api.livePreview(tab === "deposit" ? { side: "deposit", sol: value } : { side: "withdraw", usd: value })
        .then(setPreview)
        .catch(() => setPreview(null))
    }, 350)
    return () => window.clearTimeout(timer)
  }, [amount, tab, session])

  useEffect(() => {
    if (!track || track.stage === "landed" || track.stage === "failed") return
    const timer = window.setInterval(() => {
      void api.withdrawStatus(track.id).then(setTrack).catch(() => undefined)
    }, 2000)
    return () => window.clearInterval(timer)
  }, [track])

  const handleDeposit = async () => {
    const sol = Number(amount)
    if (!(sol > 0)) {
      setMessage("Enter how much SOL you want to send.")
      return
    }
    setBusy(true)
    try {
      await depositSol(sol, setMessage)
      await refresh()
    } catch (err) {
      setMessage(phantomError(err))
    } finally {
      setBusy(false)
    }
  }

  const handleReturn = async () => {
    setBusy(true)
    setMessage("")
    try {
      const result = await api.liveReturn()
      setMessage(result.message || (result.returned ? "Funds are on the way back to Phantom." : "Nothing to return yet."))
      await refresh()
    } catch (err) {
      setMessage(phantomError(err))
    } finally {
      setBusy(false)
    }
  }

  const handleWithdraw = async () => {
    const value = Number(amount)
    if (!(value > 0)) {
      setMessage("Enter how much USD you want to withdraw.")
      return
    }
    setBusy(true)
    setMessage("Taking USD off your Hyperliquid account.")
    try {
      const sent = await api.liveWithdraw(value)
      setTrack(sent)
      setMessage(sent.message)
      await refresh()
    } catch (err) {
      setMessage(phantomError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="max-w-xl">
      {embedded ? <h2 className="font-display text-2xl font-bold">Funds</h2> : <h1 className="font-display text-4xl font-extrabold">Funds</h1>}
      <p className="mt-2 text-sm text-muted">Send SOL from Phantom. It lands as USDC on your Hyperliquid account. Withdrawals come back as SOL.</p>
      {!embedded && !session && ready ? (
        <EmptyGuide
          title="Funds stay in your Hyperliquid account"
          body="SOL leaves this Phantom and arrives as USDC. Withdrawals come back to the same Phantom as SOL. Nothing moves until you confirm it."
          steps={[
            "Connect Phantom. The login message does not send SOL.",
            "Enter how much SOL to send. You will see the fee and what you receive before you confirm.",
            "After USDC lands, join a trader. Copied trades use this balance.",
          ]}
          action={<button type="button" onClick={() => void connect()} className="rounded-full bg-teal px-4 py-2 font-display text-sm font-bold text-ink">Connect Phantom</button>}
        />
      ) : null}
      {(!ready || (session && !live && !message)) ? <Hold /> : null}
      {live ? (
        <div className="mt-6 rounded-card border border-line p-4">
          <p className="font-display text-3xl font-extrabold">${usd(live.equityUsd)}</p>
          <p className="mt-1 text-xs text-muted">Equity. Withdrawable ${usd(live.withdrawableUsd)}.</p>
          <p className="mt-3 break-all font-mono text-xs text-muted">{live.address}</p>
          {live.creditMessage ? (
            <div className="mt-3">
              <p className="text-xs text-muted">{live.creditMessage}</p>
              <button type="button" onClick={() => void handleReturn()} disabled={busy} className="mt-3 rounded-full bg-teal px-4 py-2 font-display text-xs font-bold text-ink disabled:opacity-60">Return funds</button>
            </div>
          ) : null}
        </div>
      ) : null}
      {session && live ? (
        <div className="mt-6 rounded-card border border-line p-4">
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setTab("deposit")} className={`rounded-full py-2 font-display text-sm font-bold ${tab === "deposit" ? "bg-teal text-ink" : "border border-line"}`}>Deposit</button>
            <button type="button" onClick={() => setTab("withdraw")} className={`rounded-full py-2 font-display text-sm font-bold ${tab === "withdraw" ? "bg-teal text-ink" : "border border-line"}`}>Withdraw</button>
          </div>
          <label className="mt-4 block text-xs text-muted" htmlFor="fund-amount">{tab === "deposit" ? "SOL to send" : "USD to withdraw"}</label>
          <input
            id="fund-amount"
            inputMode="decimal"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className="mt-1 w-full rounded-card border border-line bg-black px-3 py-3 font-display"
          />
          {preview ? (
            <p className="mt-3 text-sm text-muted">
              {tab === "deposit"
                ? `Fee about $${usd(preview.feeUsd)}. You receive about $${usd(preview.receiveUsd)}. Usually ${preview.seconds} seconds.`
                : `Fee about $${usd(preview.feeUsd)}. You receive about ${preview.receiveSol.toFixed(4)} SOL. Usually ${preview.seconds} seconds.`}
            </p>
          ) : null}
          <button
            type="button"
            disabled={busy}
            onClick={() => void (tab === "deposit" ? handleDeposit() : handleWithdraw())}
            className="mt-4 w-full rounded-full bg-teal py-3 font-display text-sm font-bold text-ink disabled:opacity-60"
          >
            {busy ? "Waiting for Phantom" : tab === "deposit" ? "Deposit SOL" : "Withdraw to Phantom"}
          </button>
          {message ? <p className="mt-3 text-sm">{message}</p> : null}
          {track?.txHash && !track.txHash.startsWith("0x") ? (
            <a className="mt-2 inline-block font-mono text-xs text-teal" href={`https://solscan.io/tx/${track.txHash}`} target="_blank" rel="noreferrer">
              {shortAddr(track.txHash)}
            </a>
          ) : null}
        </div>
      ) : null}
      {session ? <h2 className="mt-8 font-display text-xl font-bold">Activity</h2> : null}
      {session && !activity.length ? <p className="mt-3 text-sm text-muted">Deposits and withdrawals show up here, with the fee and whether the USDC has landed.</p> : null}
      <ul className="mt-3 space-y-2">
        {activity.map((row) => (
          <li key={row.id} className="rounded-card border border-line px-4 py-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="font-display font-bold">{row.kind === "deposit" ? "Deposit" : "Withdraw"}</span>
              <span className="text-muted">{row.status}</span>
            </div>
            <p className="mt-1 text-xs text-muted">{row.message || (row.amountUsd ? `$${usd(row.amountUsd)}` : "Pending")}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}

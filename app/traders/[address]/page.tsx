"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { ApiDown, Skeleton } from "@/components/brand/Skeleton"
import { TickerLink } from "@/components/markets/TickerLink"
import { Avatar } from "@/components/traders/Avatar"
import { JoinFlow } from "@/components/traders/JoinFlow"
import { PnlLine } from "@/components/traders/PnlLine"
import { api, type Joiners, type Trader, type TraderFill } from "@/lib/api"
import { BRAND } from "@/lib/config"
import { compactUsd, px, shortAddr, signedUsd } from "@/lib/format"
import {
  averageLeverage,
  fillRead,
  groupPrints,
  holdLabel,
  nicknameFor,
  printBits,
  riskOf,
  withNames,
} from "@/lib/traderStyle"

type WindowKey = "week" | "month" | "all"

const windows: Array<{ id: WindowKey; label: string; caption: string }> = [
  { id: "week", label: "7 day", caption: "7 day P&L" },
  { id: "month", label: "30 day", caption: "30 day P&L" },
  { id: "all", label: "All", caption: "All time P&L" },
]

const Stat = ({ label, value, tip, tone = "" }: { label: string; value: string; tip: string; tone?: string }) => (
  <button type="button" title={tip} className="rounded-card border border-line p-3 text-left">
    <span className="block text-xs text-muted">{label}</span>
    <span className={`mt-1 block font-display text-sm font-bold ${tone}`}>{value}</span>
  </button>
)

export default function TraderPage() {
  const params = useParams<{ address: string }>()
  const address = params.address
  const [trader, setTrader] = useState<Trader | null>(null)
  const [fills, setFills] = useState<TraderFill[]>([])
  const [joiners, setJoiners] = useState<Joiners | null>(null)
  const [board, setBoard] = useState<Trader[]>([])
  const [error, setError] = useState("")
  const [attempt, setAttempt] = useState(0)
  const [windowKey, setWindowKey] = useState<WindowKey>("month")
  const [showPositions, setShowPositions] = useState(false)
  const [market, setMarket] = useState("all")
  const [page, setPage] = useState(0)

  useEffect(() => {
    let stop = false
    const load = async () => {
      try {
        const [detail, people, rows] = await Promise.all([
          api.trader(address),
          api.joiners(address).catch(() => ({ joiners: { count: 0, copiedUsd: 0, wallets: [] } })),
          api.traders().catch(() => ({ traders: [] as Trader[] })),
        ])
        if (stop) return
        setTrader(detail.trader)
        setFills(detail.fills)
        setJoiners(people.joiners)
        setBoard(withNames(rows.traders))
        setError("")
      } catch (err) {
        if (!stop) setError(err instanceof Error ? err.message : "Could not reach joined.fun")
      }
    }
    void load()
    return () => {
      stop = true
    }
  }, [address, attempt])

  const nickname = trader ? nicknameFor(trader) : ""
  const points = trader
    ? windowKey === "week"
      ? trader.pnl7Series ?? []
      : windowKey === "all"
        ? trader.pnlAllSeries ?? []
        : trader.pnl30Series
    : []
  const caption = windows.find((item) => item.id === windowKey)?.caption ?? "30 day P&L"
  const reads = useMemo(() => fillRead(fills), [fills])
  const leverage = trader ? averageLeverage(trader.positions) : null
  const topMarkets = trader ? [...trader.positions].sort((a, b) => b.positionValue - a.positionValue).slice(0, 3) : []
  const positions = [...(trader?.positions ?? [])].sort((a, b) => b.positionValue - a.positionValue)
  const shown = showPositions ? positions : positions.slice(0, 10)
  const grouped = useMemo(() => groupPrints(fills.filter((fill) => market === "all" || fill.label === market)), [fills, market])
  const pageCount = Math.max(1, Math.ceil(grouped.length / 8))
  const pageRows = grouped.slice(page * 8, page * 8 + 8)
  const markets = [...new Set(fills.map((fill) => fill.label))]
  const similar = trader
    ? board
      .filter((item) => item.address.toLowerCase() !== trader.address.toLowerCase())
      .map((item) => ({
        item,
        overlap: item.positions.filter((position) => trader.positions.some((mine) => mine.label === position.label)).length,
      }))
      .filter((item) => item.overlap > 0)
      .sort((a, b) => b.overlap - a.overlap)
      .slice(0, 3)
    : []
  const shareHref = trader
    ? `https://x.com/intent/tweet?text=${encodeURIComponent(`${nickname} on joined.fun ${BRAND.url}/traders/${trader.address}`)}`
    : BRAND.x
  const winTip = reads.closeWinRate !== null
    ? "Share of recent closes that made money."
    : "Share of rising steps on the 30 day line."
  const winValue = reads.closeWinRate !== null
    ? `${Math.round(reads.closeWinRate * 100)}%`
    : trader && typeof trader.winRate === "number"
      ? `${Math.round(trader.winRate * 100)}%`
      : "Pending"

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0">
        {error ? <ApiDown message={error} onRetry={() => setAttempt((value) => value + 1)} /> : null}
        {!trader && !error ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
        ) : null}
        {trader ? (
          <>
            <div className="flex items-start gap-3">
              <Avatar address={trader.address} />
              <div className="min-w-0">
                <h1 className="font-display text-3xl font-extrabold">{nickname}</h1>
                <p className="mt-1 break-all font-mono text-xs text-muted">{trader.address}</p>
                <p className="mt-1 text-xs text-muted">{riskOf(trader)} risk</p>
              </div>
            </div>
            <a href={shareHref} target="_blank" rel="noreferrer" className="mt-4 inline-flex rounded-full border border-line px-4 py-2 font-display text-sm font-bold">
              Share this trader
            </a>
            <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
              <Stat label="7 day P&L" value={signedUsd(trader.pnl7d)} tip="Profit over the last 7 days on Hyperliquid." tone={trader.pnl7d >= 0 ? "text-teal" : "text-down"} />
              <Stat label="30 day P&L" value={signedUsd(trader.pnl30d)} tip="Profit over the last 30 days on Hyperliquid." tone={trader.pnl30d >= 0 ? "text-teal" : "text-down"} />
              <Stat label="All time P&L" value={trader.pnlAll === null || trader.pnlAll === undefined ? "Pending" : signedUsd(trader.pnlAll)} tip="Profit across the full Hyperliquid history we can read." tone={typeof trader.pnlAll === "number" ? (trader.pnlAll >= 0 ? "text-teal" : "text-down") : ""} />
              <Stat label="Win rate" value={winValue} tip={winTip} />
              <Stat label="Biggest drop" value={typeof trader.maxDrop === "number" ? compactUsd(trader.maxDrop) : "Pending"} tip="Largest fall from a peak on the 30 day line." />
              <Stat label="Average leverage" value={leverage ? `${leverage >= 10 ? Math.round(leverage) : leverage.toFixed(1)}x` : "Pending"} tip="Average leverage across open stock positions, weighted by dollars." />
              <Stat label="Trades per week" value={reads.tradesPerWeek === null ? "Pending" : reads.tradesPerWeek === 0 ? "None this week" : String(reads.tradesPerWeek)} tip="Stock fills in the last 7 days. Pending when the sample is still inside that week." />
              <Stat label="Average hold" value={reads.averageHold === null ? "Pending" : holdLabel(reads.averageHold)} tip="Average time from an open to the matching close in recent fills." />
              <Stat label="Account" value={compactUsd(trader.accountValue)} tip="Hyperliquid account value." />
            </div>
            <p className="mt-3 text-sm" title="The three largest open positions by dollars.">
              <span className="text-xs text-muted">Top markets </span>
              {topMarkets.length ? topMarkets.map((position, index) => (
                <span key={position.coin}>
                  {index ? ", " : ""}
                  <TickerLink label={position.label} />
                </span>
              )) : "Pending"}
            </p>
            <div className="mt-6 flex gap-2">
              {windows.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={windowKey === item.id}
                  onClick={() => setWindowKey(item.id)}
                  className={`rounded-full px-3 py-1.5 font-display text-xs font-bold ${windowKey === item.id ? "bg-teal text-ink" : "border border-line"}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="mt-3 w-full min-w-0">
              <PnlLine points={points} caption={caption} />
            </div>
            <h2 className="mt-8 font-display text-xl font-bold">Positions</h2>
            {positions.length ? (
              <div className="mt-3 min-w-0 overflow-x-auto rounded-card border border-line">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="text-xs text-muted">
                    <tr>
                      <th className="px-3 py-2 font-medium">Market</th>
                      <th className="px-3 py-2 font-medium">Side</th>
                      <th className="px-3 py-2 font-medium">$ size</th>
                      <th className="px-3 py-2 font-medium">Leverage</th>
                      <th className="px-3 py-2 font-medium">Entry</th>
                      <th className="px-3 py-2 font-medium">Mark</th>
                      <th className="px-3 py-2 font-medium">Unrealised P&L</th>
                      <th className="px-3 py-2 font-medium">Liquidation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shown.map((position) => {
                      const mark = position.markPx && position.markPx > 0 ? position.markPx : position.size > 0 ? position.positionValue / position.size : 0
                      return (
                        <tr key={position.coin} className="border-t border-line">
                          <td className="px-3 py-2"><TickerLink label={position.label} /></td>
                          <td className={`px-3 py-2 ${position.side === "long" ? "text-teal" : "text-down"}`}>{position.side === "long" ? "Long" : "Short"}</td>
                          <td className="px-3 py-2">{compactUsd(position.positionValue)}</td>
                          <td className="px-3 py-2">{position.leverage}x</td>
                          <td className="px-3 py-2">{position.entryPx ? `$${px(position.entryPx)}` : "Pending"}</td>
                          <td className="px-3 py-2">{mark ? `$${px(mark)}` : "Pending"}</td>
                          <td className={`px-3 py-2 ${position.unrealizedPnl >= 0 ? "text-teal" : "text-down"}`}>{signedUsd(position.unrealizedPnl)}</td>
                          <td className="px-3 py-2">{position.liquidation ? `$${px(position.liquidation)}` : "Pending"}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : <p className="mt-3 text-sm text-muted">No open stock positions.</p>}
            {positions.length > 10 ? (
              <button type="button" onClick={() => setShowPositions((value) => !value)} className="mt-3 font-display text-sm font-bold text-teal">
                {showPositions ? "Show less" : "Show all"}
              </button>
            ) : null}
            <h2 className="mt-8 font-display text-xl font-bold">Trades</h2>
            <label className="mt-3 block text-xs text-muted" htmlFor="fill-market">Market</label>
            <select
              id="fill-market"
              value={market}
              onChange={(event) => {
                setMarket(event.target.value)
                setPage(0)
              }}
              className="mt-1 rounded-card border border-line bg-black px-3 py-2 text-sm"
            >
              <option value="all">All markets</option>
              {markets.map((label) => <option key={label} value={label}>{label}</option>)}
            </select>
            {pageRows.length ? (
              <ul className="mt-3 space-y-2">
                {pageRows.map((print) => {
                  const bits = printBits(print)
                  return (
                    <li key={print.key} className="text-sm">
                      {bits.verb} {bits.size} <TickerLink label={print.label} /> at ${bits.price}
                    </li>
                  )
                })}
              </ul>
            ) : <p className="mt-3 text-sm text-muted">Recent stock fills show up here.</p>}
            {pageCount > 1 ? (
              <div className="mt-3 flex gap-2">
                <button type="button" disabled={page === 0} onClick={() => setPage((value) => value - 1)} className="rounded-full border border-line px-3 py-1.5 font-display text-xs font-bold disabled:text-muted">Previous</button>
                <button type="button" disabled={page + 1 >= pageCount} onClick={() => setPage((value) => value + 1)} className="rounded-full border border-line px-3 py-1.5 font-display text-xs font-bold disabled:text-muted">Next</button>
              </div>
            ) : null}
            <h2 className="mt-8 font-display text-xl font-bold">Joiners</h2>
            {joiners && joiners.count > 0 ? (
              <div className="mt-3">
                <p className="text-sm">{joiners.count} joined. Copied size {compactUsd(joiners.copiedUsd)}.</p>
                <ul className="mt-2 space-y-1">
                  {joiners.wallets.map((wallet) => (
                    <li key={wallet} className="break-all font-mono text-xs text-muted">{wallet}</li>
                  ))}
                </ul>
              </div>
            ) : <p className="mt-3 text-sm text-muted">Be the first to join</p>}
            <h2 className="mt-8 font-display text-xl font-bold">Similar traders</h2>
            {similar.length ? (
              <ul className="mt-3 space-y-2">
                {similar.map(({ item }) => (
                  <li key={item.address}>
                    <Link href={`/traders/${item.address}`} className="flex items-center gap-3 text-sm">
                      <Avatar address={item.address} />
                      <span className="font-display font-bold">{nicknameFor(item)}</span>
                      <span className={item.pnl30d >= 0 ? "text-teal" : "text-down"}>{signedUsd(item.pnl30d)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : <p className="mt-3 text-sm text-muted">No overlapping markets on the board right now.</p>}
            <p className="mt-6 font-mono text-[11px] text-muted">{shortAddr(trader.address)}</p>
          </>
        ) : null}
      </div>
      <aside className="hidden lg:block">
        <div className="sticky top-24 rounded-card border border-line p-4">
          {trader ? <JoinFlow trader={trader} formId="desk" /> : <Skeleton className="h-64 w-full" />}
        </div>
      </aside>
      {trader ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-black px-4 py-3 sm:px-6 lg:hidden">
          <JoinFlow trader={trader} formId="bar" compact />
        </div>
      ) : null}
    </div>
  )
}

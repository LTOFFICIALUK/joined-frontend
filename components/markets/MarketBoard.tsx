"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ApiDown, Skeleton } from "@/components/brand/Skeleton"
import { Avatar } from "@/components/traders/Avatar"
import { api, type BoardMarket, type MarketHolder, type TapePrint } from "@/lib/api"
import { compactUsd, when } from "@/lib/format"
import { groupPrints, printBits } from "@/lib/traderStyle"

export const MarketBoard = ({
  ticker,
  initial,
}: {
  ticker: string
  initial: (BoardMarket & { holders: MarketHolder[]; prints: TapePrint[] }) | null
}) => {
  const [market, setMarket] = useState(initial)
  const [error, setError] = useState(initial ? "" : "Could not reach joined.fun")
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    setMarket(initial)
    setError(initial ? "" : "Could not reach joined.fun")
  }, [ticker, initial])

  useEffect(() => {
    if (attempt === 0) return
    let stop = false
    const load = async () => {
      try {
        const data = await api.boardMarket(ticker)
        if (stop) return
        setMarket(data.market)
        setError("")
      } catch (err) {
        if (!stop) setError(err instanceof Error ? err.message : "Could not reach joined.fun")
      }
    }
    void load()
    return () => {
      stop = true
    }
  }, [ticker, attempt])

  const total = market ? market.longUsd + market.shortUsd : 0
  const longShare = total > 0 && market ? Math.round((market.longUsd / total) * 100) : 0
  const prints = market ? groupPrints(market.prints) : []

  return (
    <section className="min-w-0">
      <h1 className="font-display text-4xl font-extrabold">{ticker}</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">How the top wallets are positioned.</p>
      {error ? <div className="mt-6"><ApiDown message={error} onRetry={() => setAttempt((value) => value + 1)} /></div> : null}
      {!market && !error ? <div className="mt-6 space-y-3"><Skeleton className="h-16 w-full" /><Skeleton /><Skeleton /></div> : null}
      {market ? (
        <>
          <div className="mt-6">
            <div className="flex h-3 overflow-hidden rounded-full bg-line">
              <div className="bg-teal" style={{ width: `${longShare}%` }} />
            </div>
            <p className="mt-2 text-sm">Long {compactUsd(market.longUsd)} across {market.longWallets} wallets. Short {compactUsd(market.shortUsd)} across {market.shortWallets} wallets.</p>
            <p className="mt-1 text-sm text-muted">Biggest position {compactUsd(market.biggestUsd)} {market.biggestSide}.</p>
          </div>
          <h2 className="mt-8 font-display text-xl font-bold">Top wallets</h2>
          <ul className="mt-3 space-y-3">
            {market.holders.map((holder) => (
              <li key={holder.address} className="flex items-center gap-3">
                <Avatar address={holder.address} />
                <div className="min-w-0 flex-1">
                  <Link href={`/traders/${holder.address}`} className="block truncate font-display text-sm font-bold">{holder.nickname}</Link>
                  <p className="text-xs text-muted">{holder.side === "long" ? "Long" : "Short"} {compactUsd(holder.sizeUsd)} · {holder.leverage}x</p>
                </div>
                <Link href={`/traders/${holder.address}`} className="rounded-full bg-teal px-3 py-2 font-display text-xs font-bold text-ink">Join</Link>
              </li>
            ))}
          </ul>
          <h2 className="mt-8 font-display text-xl font-bold">Recent trades</h2>
          {prints.length ? (
            <ul className="mt-3 space-y-2">
              {prints.map((print) => {
                const bits = printBits(print)
                return (
                  <li key={print.key} className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate">{print.nickname || "Trader"} {bits.verb} {bits.size} {print.label} at ${bits.price}</span>
                    <span className="shrink-0 text-xs text-muted">{when(print.time)}</span>
                  </li>
                )
              })}
            </ul>
          ) : <p className="mt-3 text-sm text-muted">The first trade from these wallets lands here.</p>}
        </>
      ) : null}
    </section>
  )
}

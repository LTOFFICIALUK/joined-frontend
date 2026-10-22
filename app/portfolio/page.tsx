"use client"

import Link from "next/link"
import CopiesPage from "@/app/copies/page"
import FundsPage from "@/app/funds/page"
import PositionsPage from "@/app/positions/page"
import { useSession } from "@/app/providers"
import { EmptyGuide } from "@/components/shell/EmptyGuide"
import { EmbedProvider } from "@/lib/embed"

export default function PortfolioPage() {
  const { session, ready, connect } = useSession()

  return (
    <section>
      <h1 className="font-display text-4xl font-extrabold">Portfolio</h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">Your copies, your stock positions, and the SOL that funds them.</p>
      {!session && ready ? (
        <EmptyGuide
          title="Nothing in the portfolio yet"
          body="Traders is where you join. This page keeps the copies, the positions, and the balance in one place."
          steps={[
            "Pick a trader and a size. The login message does not send funds.",
            "If the Hyperliquid account is empty, send SOL from the join button. It lands as USDC.",
            "Confirm. New stock trades show up here.",
          ]}
          action={(
            <>
              <button type="button" onClick={() => void connect()} className="rounded-full bg-teal px-4 py-2 font-display text-sm font-bold text-ink">Connect Phantom</button>
              <Link href="/traders" className="rounded-full border border-line px-4 py-2 font-display text-sm font-bold">Find a trader</Link>
            </>
          )}
        />
      ) : null}
      {session ? (
        <EmbedProvider>
          <div className="mt-8"><CopiesPage /></div>
          <div className="mt-10"><PositionsPage /></div>
          <div className="mt-10"><FundsPage /></div>
        </EmbedProvider>
      ) : null}
    </section>
  )
}

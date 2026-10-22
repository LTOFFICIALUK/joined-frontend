"use client"

import Link from "next/link"
import { useCallback, useEffect, useLayoutEffect, useState } from "react"
import { BootScreen } from "@/components/brand/BootScreen"
import { HomeBoard } from "@/components/home/HomeBoard"
import { hasPlayedBoot, markBootPlayed, readBoard } from "@/lib/boardCache"
import type { TapePrint, Trader } from "@/lib/api"

export const Home = ({
  initialTraders,
  initialTape,
}: {
  initialTraders: Trader[] | null
  initialTape: TapePrint[] | null
}) => {
  const [cover, setCover] = useState(true)
  const [revealed, setRevealed] = useState(false)
  const [ready, setReady] = useState(false)
  const [orbit, setOrbit] = useState<HTMLDivElement | null>(null)

  useLayoutEffect(() => {
    if (!hasPlayedBoot() && !readBoard()) return
    markBootPlayed()
    setCover(false)
    setRevealed(true)
  }, [])

  const handleReady = useCallback(() => setReady(true), [])
  const handleDepart = useCallback(() => setRevealed(true), [])
  const handleDone = useCallback(() => {
    markBootPlayed()
    setCover(false)
  }, [])

  useEffect(() => {
    if (!cover) return
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previous
    }
  }, [cover])

  return (
    <>
      {cover ? <BootScreen canDepart={ready} orbit={orbit} onDepart={handleDepart} onDone={handleDone} /> : null}
      <section className={`transition-opacity duration-[1100ms] ease-out motion-reduce:transition-none ${revealed ? "opacity-100" : "pointer-events-none opacity-0"}`}>
        <h1 className="max-w-4xl font-display text-[40px] font-extrabold leading-[1.05] sm:text-6xl lg:text-7xl">
          One trader.
          <br />
          <span className="text-teal">Everyone</span> joins in.
        </h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-muted sm:mt-6 sm:text-lg">
          Pick a top stock trader on Hyperliquid. Join, and your Phantom wallet follows every trade they make.
        </p>
        <Link href="/traders" className="mt-6 inline-flex rounded-full bg-teal px-5 py-3 font-display text-sm font-bold text-ink sm:mt-8">
          Find a trader
        </Link>
        <ol className="mt-10 grid gap-3 sm:mt-14 sm:grid-cols-3 sm:gap-4">
          {[
            ["1", "Pick a trader", "Open the board and choose a wallet with stock perps on."],
            ["2", "Choose a size", "Your copy is a dollar size, with a leverage cap if you want one."],
            ["3", "Follow the next trade", "Connect Phantom, send SOL if the account is empty, then confirm."],
          ].map(([step, title, body]) => (
            <li key={step} className="rounded-card border border-line p-4 sm:p-5">
              <p className="font-display text-sm font-bold text-teal">{step}</p>
              <p className="mt-2 font-display text-base font-bold">{title}</p>
              <p className="mt-1 text-sm text-muted">{body}</p>
            </li>
          ))}
        </ol>
        <HomeBoard orbitRef={setOrbit} showBubbles={!cover} onReady={handleReady} initialTraders={initialTraders} initialTape={initialTape} />
      </section>
    </>
  )
}

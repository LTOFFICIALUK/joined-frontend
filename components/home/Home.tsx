"use client"

import Link from "next/link"
import { useCallback, useEffect, useLayoutEffect, useState } from "react"
import { BootScreen } from "@/components/brand/BootScreen"
import { HomeBoard } from "@/components/home/HomeBoard"
import { hasPlayedBoot, markBootPlayed, readBoard } from "@/lib/boardCache"

export const Home = () => {
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
        <h1 className="max-w-4xl font-display text-[40px] font-extrabold leading-[1.02] sm:text-7xl">
          One trader.
          <br />
          <span className="text-teal">Everyone</span> joins in.
        </h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
          Pick a top stock trader on Hyperliquid. Join, and your Phantom wallet follows every trade they make.
        </p>
        <Link href="/traders" className="mt-6 inline-flex rounded-full bg-teal px-5 py-3 font-display text-sm font-bold text-ink">
          Find a trader
        </Link>
        <HomeBoard orbitRef={setOrbit} showBubbles={!cover} onReady={handleReady} />
      </section>
    </>
  )
}

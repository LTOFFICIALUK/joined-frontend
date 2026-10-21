import Link from "next/link"
import { HomeBoard } from "@/components/home/HomeBoard"

export default function Page() {
  return (
    <section>
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
      <HomeBoard />
    </section>
  )
}

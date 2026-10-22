import type { Metadata } from "next"

export const metadata: Metadata = {
  title: { absolute: "joined: Terms" },
  description: "Copy trading can lose money. Past results are not future results.",
}

export default function TermsPage() {
  return (
    <section className="max-w-2xl">
      <h1 className="font-display text-4xl font-extrabold">Terms</h1>
      <p className="mt-4 text-sm leading-relaxed sm:mt-5">Copy trading can lose money. A trader&apos;s past P&amp;L is not future P&amp;L. You can lose the size you join with, and leverage can wipe that size on a smaller move. You choose the size, the leverage cap, and when to stop. joined does not charge a copy fee. Bridge fees go to Relay. Trading fees stay on Hyperliquid.</p>
    </section>
  )
}

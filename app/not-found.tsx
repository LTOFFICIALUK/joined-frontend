import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = { title: { absolute: "joined: Page not found" } }

export default function NotFound() {
  return (
    <section>
      <h1 className="font-display text-4xl font-extrabold">Page not found</h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted sm:mt-4">That page is not on joined. Head home, or open the trader board and pick someone to follow.</p>
      <div className="mt-6 flex flex-wrap gap-2">
        <Link href="/" className="inline-flex rounded-full bg-teal px-4 py-2 font-display text-sm font-bold text-ink">Back home</Link>
        <Link href="/traders" className="inline-flex rounded-full border border-line px-4 py-2 font-display text-sm font-bold">Find a trader</Link>
      </div>
    </section>
  )
}

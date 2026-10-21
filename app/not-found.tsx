import Link from "next/link"

export default function NotFound() {
  return (
    <section>
      <h1 className="font-display text-4xl font-extrabold">Page not found</h1>
      <p className="mt-3 text-sm text-muted">That page is not on joined.</p>
      <Link href="/" className="mt-6 inline-flex rounded-full bg-teal px-4 py-2 font-display text-sm font-bold text-ink">Back home</Link>
    </section>
  )
}

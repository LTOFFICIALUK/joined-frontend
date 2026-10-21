"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { shortAddr } from "@/lib/format"
import { phantomInstallUrl } from "@/lib/phantom"
import { useSession } from "@/app/providers"
import { Footer } from "@/components/shell/Footer"

const links = [
  { href: "/traders", label: "Traders" },
  { href: "/copies", label: "My copies" },
  { href: "/positions", label: "Positions" },
  { href: "/funds", label: "Funds" },
]

export const Frame = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname()
  const { session, busy, hint, connect, disconnect } = useSession()
  const [open, setOpen] = useState(false)

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-line">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-4 gap-y-3 px-4 py-4">
          <Link href="/" className="flex items-center gap-2" aria-label="joined home">
            <img src="/brand/joined-mark-white.svg" alt="" className="h-7 w-7" />
            <span className="font-display text-[22px] font-extrabold tracking-tight">joined</span>
          </Link>
          <nav className="flex flex-wrap items-center gap-1" aria-label="Primary">
            {links.map((link) => {
              const active = pathname === link.href || pathname.startsWith(`${link.href}/`)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-full px-3 py-1.5 text-sm ${active ? "bg-teal text-ink" : "text-muted"}`}
                  aria-current={active ? "page" : undefined}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>
          <div className="ml-auto">
            {session ? (
              <button
                type="button"
                onClick={disconnect}
                className="rounded-full border border-line px-3 py-2 font-mono text-xs text-paper"
                aria-label="Disconnect Phantom"
              >
                {shortAddr(session.pubkey)}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="rounded-full bg-teal px-4 py-2 font-display text-sm font-bold text-ink"
              >
                Connect Phantom
              </button>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
      <Footer />
      {open && !session ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center" role="presentation" onClick={() => { if (!busy) setOpen(false) }}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Connect Phantom"
            className="w-full max-w-md rounded-card border border-line bg-black p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="font-display text-2xl font-bold">Connect Phantom</h2>
            <p className="mt-2 text-sm text-muted">Sign in to join a trader, fund your Hyperliquid account, and see your copies.</p>
            <p className="mt-4 min-h-5 text-sm text-paper">{hint}</p>
            {hint === "Phantom is not installed" ? (
              <a href={phantomInstallUrl} className="mt-4 inline-flex rounded-full bg-teal px-4 py-2 font-display text-sm font-bold text-ink">Get Phantom</a>
            ) : (
              <button type="button" onClick={() => void connect()} disabled={busy} className="mt-4 w-full rounded-full bg-teal py-3 font-display text-sm font-bold text-ink disabled:opacity-60">
                {busy ? "Waiting for Phantom" : "Connect Phantom"}
              </button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}

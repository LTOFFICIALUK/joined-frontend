"use client"

import Link from "next/link"
import { useState } from "react"
import { BRAND } from "@/lib/config"

const pages = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/markets", label: "Markets" },
  { href: "/live", label: "Live" },
  { href: "/stats", label: "Stats" },
  { href: "/terms", label: "Terms" },
]

export const Footer = () => {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!BRAND.ca) return
    await navigator.clipboard.writeText(BRAND.ca)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <footer className="mt-auto border-t border-line">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {BRAND.x ? (
            <a href={BRAND.x} className="font-display text-sm font-bold text-paper" target="_blank" rel="noreferrer">
              {BRAND.xHandle}
            </a>
          ) : (
            <span className="font-display text-sm font-bold text-muted">X Pending</span>
          )}
          <a href={BRAND.url} className="text-sm text-muted">{BRAND.domain}</a>
        </div>
        <nav className="flex flex-wrap gap-x-4 gap-y-2" aria-label="Footer">
          {pages.map((page) => (
            <Link key={page.href} href={page.href} className="text-sm text-muted">
              {page.label}
            </Link>
          ))}
        </nav>
        <div className="min-w-0 sm:max-w-md sm:text-right">
          <div className="flex items-center gap-3 sm:justify-end">
            <span className="font-display text-sm font-extrabold">{BRAND.ticker}</span>
            <button
              type="button"
              onClick={() => void handleCopy()}
              disabled={!BRAND.ca}
              className="shrink-0 rounded-full border border-line px-3 py-1.5 font-display text-xs font-bold text-paper disabled:text-muted"
              aria-label="Copy contract address"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <p className="mt-2 break-all font-mono text-xs text-muted">{BRAND.ca || "Pending"}</p>
        </div>
      </div>
    </footer>
  )
}

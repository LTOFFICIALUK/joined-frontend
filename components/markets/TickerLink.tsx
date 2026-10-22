import Link from "next/link"

export const TickerLink = ({ label, className = "" }: { label: string; className?: string }) => (
  <Link href={`/markets/${encodeURIComponent(label)}`} className={`text-teal ${className}`}>
    {label}
  </Link>
)

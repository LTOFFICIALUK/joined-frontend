export const pricePrecision = (n: number) => {
  const abs = Math.abs(n)
  if (!Number.isFinite(abs) || abs === 0) return 2
  if (abs >= 1000) return 2
  if (abs >= 1) return 2
  if (abs >= 0.01) return 4
  return 6
}

export const px = (n: number) => {
  if (!Number.isFinite(n)) return "Pending"
  return n.toLocaleString("en-US", {
    maximumFractionDigits: pricePrecision(n),
    minimumFractionDigits: 0,
  })
}

export const usd = (n: number) => {
  if (!Number.isFinite(n)) return "Pending"
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export const signedUsd = (n: number) => {
  if (!Number.isFinite(n)) return "Pending"
  const abs = Math.abs(n)
  const body = abs >= 1_000_000_000
    ? `$${(abs / 1_000_000_000).toFixed(2)}B`
    : abs >= 1_000_000
      ? `$${(abs / 1_000_000).toFixed(1)}M`
      : abs >= 10_000
        ? `$${(abs / 1_000).toFixed(1)}K`
        : `$${usd(abs)}`
  if (n > 0) return `+${body}`
  if (n < 0) return `−${body}`
  return body
}

export const shortAddr = (value: string) => {
  if (!value || value.length < 12) return value || "Pending"
  return `${value.slice(0, 6)}…${value.slice(-4)}`
}

export const sz = (n: number) => {
  if (!Number.isFinite(n)) return "Pending"
  if (n >= 100) return n.toFixed(2)
  if (n >= 1) return n.toFixed(3)
  return n.toFixed(4)
}

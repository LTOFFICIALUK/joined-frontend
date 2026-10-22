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
  const digits = n >= 100 ? 2 : n >= 1 ? 3 : 4
  return n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: digits })
}

export const when = (time: number) => {
  if (!Number.isFinite(time) || time <= 0) return "Pending"
  const ms = time < 1e12 ? time * 1000 : time
  return new Date(ms).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
}

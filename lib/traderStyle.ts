import type { PnlPoint, Trader, TraderFill, TraderPosition } from "@/lib/api"
import { compactUsd } from "@/lib/format"

export type Risk = "Low" | "Medium" | "High"

const CHIPS = new Set(["MU", "SNDK", "DRAM", "SKHX", "SKHY", "KIOXIA", "WDC"])

const PRETTY: Record<string, string> = {
  GOLD: "Gold",
  SILVER: "Silver",
  PLATINUM: "Platinum",
  PALLADIUM: "Palladium",
  COPPER: "Copper",
  NATGAS: "Gas",
  BRENTOIL: "Brent",
  CL: "Crude",
  NVDA: "Nvidia",
  TSLA: "Tesla",
  META: "Meta",
  AAPL: "Apple",
  AMZN: "Amazon",
  MSFT: "Microsoft",
  GOOGL: "Google",
  AMD: "AMD",
  INTC: "Intel",
  PLTR: "Palantir",
  COIN: "Coinbase",
  HOOD: "Robinhood",
  MSTR: "Strategy",
  TSM: "TSMC",
  NFLX: "Netflix",
  AVGO: "Broadcom",
  SP500: "Index",
  XYZ100: "Index",
  SPCX: "Space",
}

const SPOKEN: Record<string, string> = {
  GOLD: "gold",
  SILVER: "silver",
  PLATINUM: "platinum",
  PALLADIUM: "palladium",
  COPPER: "copper",
  NATGAS: "natural gas",
  BRENTOIL: "brent",
  CL: "crude",
  SP500: "the index",
  XYZ100: "the index",
}

export const monthStats = (series: PnlPoint[]) => {
  if (series.length < 2) return { winRate: 0.5, maxDrop: 0 }
  let up = 0
  let down = 0
  let peak = series[0]?.v ?? 0
  let maxDrop = 0
  for (let index = 1; index < series.length; index += 1) {
    const prev = series[index - 1]?.v ?? 0
    const next = series[index]?.v ?? 0
    if (next > prev) up += 1
    else if (next < prev) down += 1
    peak = Math.max(peak, next)
    maxDrop = Math.max(maxDrop, peak - next)
  }
  const steps = up + down
  return { winRate: steps ? up / steps : 0.5, maxDrop }
}

export const copyScore = (trader: Pick<Trader, "pnl30d" | "accountValue" | "pnl30Series"> & { winRate?: number; maxDrop?: number; score?: number }) => {
  if (typeof trader.score === "number") return trader.score
  const stats = typeof trader.winRate === "number" && typeof trader.maxDrop === "number"
    ? { winRate: trader.winRate, maxDrop: trader.maxDrop }
    : monthStats(trader.pnl30Series ?? [])
  const quality = 0.4 + 0.6 * Math.min(1, Math.max(0, stats.winRate))
  const base = trader.accountValue > 0 ? trader.accountValue : Math.max(Math.abs(trader.pnl30d), 1)
  return trader.pnl30d * quality * (1 / (1 + stats.maxDrop / base))
}

export const leadPosition = (trader: Pick<Trader, "positions">) =>
  [...trader.positions].sort((a, b) => b.positionValue - a.positionValue)[0] ?? null

export const riskOf = (trader: Pick<Trader, "accountValue" | "positions">): Risk => {
  if (!trader.positions.length) return "Low"
  const leverage = Math.max(...trader.positions.map((position) => position.leverage || 1))
  const notional = trader.positions.reduce((sum, position) => sum + position.positionValue, 0)
  const exposure = trader.accountValue > 0 ? notional / trader.accountValue : leverage
  if (leverage >= 10 || exposure >= 5) return "High"
  if (leverage >= 4 || exposure >= 2) return "Medium"
  return "Low"
}

export const nicknameFor = (trader: Pick<Trader, "positions">) => {
  const positions = trader.positions
  if (!positions.length) return "Trader"
  const gross = positions.reduce((sum, position) => sum + position.positionValue, 0) || 1
  const chips = positions.filter((position) => CHIPS.has(position.label.toUpperCase()))
  const chipNotional = chips.reduce((sum, position) => sum + position.positionValue, 0)
  if (chips.length && chipNotional / gross >= 0.35) {
    const shortNotional = chips.filter((position) => position.side === "short").reduce((sum, position) => sum + position.positionValue, 0)
    return shortNotional * 2 >= chipNotional ? "Memory Chip Bear" : "Memory Chip Bull"
  }
  const lead = leadPosition(trader)
  if (!lead) return "Trader"
  if (CHIPS.has(lead.label.toUpperCase())) return lead.side === "short" ? "Memory Chip Bear" : "Memory Chip Bull"
  const pretty = PRETTY[lead.label.toUpperCase()] ?? lead.label
  return lead.side === "short" ? `${pretty} Shorter` : `${pretty} Longer`
}

export const spokenAsset = (label: string) => SPOKEN[label.toUpperCase()] ?? label

export const positionBrief = (position: Pick<TraderPosition, "label" | "side" | "positionValue" | "leverage">) =>
  `${compactUsd(position.positionValue)} ${position.side} ${position.label} · ${position.leverage}x`

export const sizeLabel = (sizeUsd: number) => {
  if (!Number.isFinite(sizeUsd) || sizeUsd <= 0) return "$0"
  if (sizeUsd >= 1000) return `$${Math.round(sizeUsd).toLocaleString("en-US")}`
  return `$${Math.round(sizeUsd)}`
}

export const followLine = (trader: Pick<Trader, "positions">, sizeUsd: number, cap: number | null) => {
  const lead = leadPosition(trader)
  const money = sizeLabel(sizeUsd)
  if (!lead || !(sizeUsd > 0)) return `Your ${money} follows this trader from the next stock trade. Existing positions stay theirs.`
  const leverage = Math.max(1, Math.min(lead.leverage || 1, cap && cap > 0 ? cap : lead.leverage || 1))
  const wipe = Math.max(1, Math.round(100 / leverage))
  const name = spokenAsset(lead.label)
  return `Your ${money} follows a ${leverage}x ${name} ${lead.side}. A ~${wipe}% move in ${name} against it would wipe out that ${money}.`
}

export const maxLeverageOf = (trader: Pick<Trader, "positions">) =>
  trader.positions.reduce((max, position) => Math.max(max, position.leverage || 1), 1)

export type Print = {
  key: string
  address?: string
  label: string
  side: "long" | "short"
  size: number
  price: number
  time: number
}

const asMs = (time: number) => (time > 0 && time < 1e12 ? time * 1000 : time)

export const groupPrints = (fills: Array<Pick<TraderFill, "label" | "side" | "size" | "price" | "time"> & { address?: string }>): Print[] => {
  const ordered = [...fills].sort((a, b) => asMs(b.time) - asMs(a.time))
  const groups: Print[] = []
  for (const fill of ordered) {
    if (!(fill.size > 0) || !(fill.price > 0)) continue
    const current = groups[groups.length - 1]
    const closeInTime = current && Math.abs(asMs(current.time) - asMs(fill.time)) <= 90_000
    const sameTrade = current
      && current.label === fill.label
      && current.side === fill.side
      && current.address === fill.address
      && closeInTime
    if (!current || !sameTrade) {
      groups.push({
        key: `${fill.address ?? ""}-${fill.label}-${fill.time}-${fill.side}`,
        address: fill.address,
        label: fill.label,
        side: fill.side,
        size: fill.size,
        price: fill.price,
        time: fill.time,
      })
      continue
    }
    const notional = current.price * current.size + fill.price * fill.size
    current.size += fill.size
    current.price = notional / current.size
    current.time = Math.max(current.time, fill.time)
  }
  return groups
}

export const printLine = (print: Pick<Print, "side" | "size" | "label" | "price">) => {
  const verb = print.side === "long" ? "Bought" : "Sold"
  const size = print.size >= 100 ? print.size.toFixed(0) : print.size >= 1 ? print.size.toFixed(1) : print.size.toFixed(2)
  const price = print.price >= 1000 ? print.price.toLocaleString("en-US", { maximumFractionDigits: 0 }) : print.price.toLocaleString("en-US", { maximumFractionDigits: 2 })
  return `${verb} ${size} ${print.label} at $${price}`
}

export const avatarDots = (address: string) => {
  let hash = 2166136261
  for (const char of address.toLowerCase()) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619)
  const next = () => {
    hash = (Math.imul(hash, 1664525) + 1013904223) >>> 0
    return hash / 4294967296
  }
  const colors = ["#50D2C1", "#7EE8DC", "#2EAA98", "#F2F2F0", "#1C7A6E"]
  return Array.from({ length: 5 }, (_, index) => ({
    left: 22 + next() * 56,
    top: 22 + next() * 56,
    size: 5 + next() * 6,
    color: colors[index] ?? "#50D2C1",
  }))
}

export const marketNote = (now = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now)
  const weekday = parts.find((part) => part.type === "weekday")?.value ?? ""
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0")
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? "0")
  const weekend = weekday === "Sat" || weekday === "Sun"
  const minutes = hour * 60 + minute
  const open = !weekend && minutes >= 9 * 60 + 30 && minutes < 16 * 60
  return open
    ? "US stock market is open. These perps trade around the clock."
    : "US stock market is closed. These perps trade around the clock."
}

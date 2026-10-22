import {
  type BoardMarket,
  type Joiners,
  type MarketHolder,
  type SiteStats,
  type TapePrint,
  type Trader,
  type TraderFill,
} from "@/lib/api"
import { apiUrl } from "@/lib/config"

const REVALIDATE = 30

const read = async <T>(path: string): Promise<T | null> => {
  if (!apiUrl) return null
  try {
    const res = await fetch(`${apiUrl}${path}`, { next: { revalidate: REVALIDATE } })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

export const loadTraders = async () => {
  const data = await read<{ traders: Trader[]; asOf: number }>("/traders")
  if (!data) return null
  return { traders: data.traders ?? [], asOf: data.asOf ?? Date.now() }
}

export const loadTape = async () => {
  const data = await read<{ tape: TapePrint[] }>("/traders/tape")
  if (!data) return null
  return data.tape ?? []
}

export const loadMarkets = async () => {
  const data = await read<{ markets: BoardMarket[] }>("/traders/markets")
  if (!data) return null
  return data.markets ?? []
}

export const loadMarket = async (ticker: string) => {
  const data = await read<{ market: BoardMarket & { holders: MarketHolder[]; prints: TapePrint[] } }>(
    `/traders/markets/${encodeURIComponent(ticker)}`,
  )
  return data?.market ?? null
}

export const loadStats = async () => {
  const data = await read<{ stats: SiteStats }>("/traders/stats")
  return data?.stats ?? null
}

export const loadTrader = async (address: string) => {
  return read<{ trader: Trader; fills: TraderFill[] }>(`/traders/${address}`)
}

export const loadJoiners = async (address: string) => {
  const data = await read<{ joiners: Joiners }>(`/traders/${address}/joiners`)
  return data?.joiners ?? { count: 0, copiedUsd: 0, wallets: [] }
}

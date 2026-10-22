import type { Trader } from "@/lib/api"

let rows: Trader[] | null = null
let bootPlayed = false

export const hasPlayedBoot = () => bootPlayed

export const markBootPlayed = () => {
  bootPlayed = true
}

export const readBoard = () => rows

export const writeBoard = (next: Trader[]) => {
  rows = next
}

export const traderFromBoard = (address: string) =>
  rows?.find((row) => row.address.toLowerCase() === address.toLowerCase()) ?? null

import { apiUrl } from "./config"

const API = apiUrl

export const tokenKey = "joined.session"

export const getToken = () =>
  typeof window === "undefined" ? "" : localStorage.getItem(tokenKey) ?? ""

export const setToken = (token: string) => localStorage.setItem(tokenKey, token)

export const clearToken = () => localStorage.removeItem(tokenKey)

export const errorMessage = (value: unknown, fallback = "Request failed"): string => {
  if (typeof value === "string") {
    const text = value.trim()
    if (!text || text === "null" || text === "undefined") return fallback
    return text
  }
  if (value instanceof Error) return errorMessage(value.message, fallback)
  if (value && typeof value === "object" && "message" in value) {
    return errorMessage((value as { message: unknown }).message, fallback)
  }
  return fallback
}

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  if (!API) throw new Error("Could not reach joined.fun")
  const headers = new Headers(init?.headers)
  headers.set("content-type", "application/json")
  const token = getToken()
  if (token) headers.set("authorization", `Bearer ${token}`)
  let res: Response
  try {
    res = await fetch(`${API}${path}`, { ...init, headers })
  } catch {
    throw new Error("Could not reach joined.fun")
  }
  const data = (await res.json().catch(() => ({ error: "Bad response" }))) as { error?: unknown }
  if (!res.ok) throw new Error(errorMessage(data.error, "Request failed"))
  return data as T
}

export type Market = {
  coin: string
  label?: string
  szDecimals: number
  maxLeverage: number
  markPx: number
}

type HyperliquidPosition = {
  position: {
    coin: string
    szi: string
    entryPx: string | null
    positionValue: string
    unrealizedPnl: string
    liquidationPx: string | null
    leverage: { value: number; type: string }
  }
}

type LiveResponse = {
  address: string
  state: {
    marginSummary?: { accountValue?: string; totalMarginUsed?: string; totalNtlPos?: string }
    withdrawable?: string
    assetPositions?: HyperliquidPosition[]
  }
  orders: Array<{ coin: string; side: "B" | "A"; limitPx: string; sz: string; oid: number; timestamp: number }>
  fills: Array<{ coin: string; side: "B" | "A"; px: string; sz: string; fee: string; closedPnl: string; time: number; tid: number }>
  parkedUsdc?: number
  creditMessage?: string
}

export type LiveAccount = {
  address: string
  equityUsd: number
  withdrawableUsd: number
  marginUsedUsd: number
  parkedUsdc: number
  creditMessage: string
  positions: Array<{
    id: string
    coin: string
    label: string
    side: "long" | "short"
    size: number
    entryPx: number
    positionValue: number
    unrealizedPnl: number
    liquidation: number | null
    leverage: number
  }>
}

const normalizeLiveAccount = (response: LiveResponse): LiveAccount => ({
  address: response.address,
  equityUsd: Number(response.state.marginSummary?.accountValue ?? 0),
  withdrawableUsd: Number(response.state.withdrawable ?? 0),
  marginUsedUsd: Number(response.state.marginSummary?.totalMarginUsed ?? 0),
  parkedUsdc: Number(response.parkedUsdc ?? 0),
  creditMessage: response.creditMessage ?? "",
  positions: (response.state.assetPositions ?? [])
    .map(({ position }) => {
      const signedSize = Number(position.szi)
      return {
        id: `${response.address}:${position.coin}`,
        coin: position.coin,
        label: position.coin.split(":").pop() ?? position.coin,
        side: signedSize >= 0 ? "long" as const : "short" as const,
        size: Math.abs(signedSize),
        entryPx: Number(position.entryPx ?? 0),
        positionValue: Math.abs(Number(position.positionValue)),
        unrealizedPnl: Number(position.unrealizedPnl),
        liquidation: position.liquidationPx ? Number(position.liquidationPx) : null,
        leverage: Number(position.leverage?.value ?? 1),
      }
    })
    .filter((position) => position.size > 0),
})

export type PnlPoint = { t: number; v: number }

export type TraderPosition = {
  coin: string
  label: string
  side: "long" | "short"
  size: number
  leverage: number
  positionValue: number
  unrealizedPnl: number
}

export type Trader = {
  address: string
  displayName: string | null
  accountValue: number
  pnl7d: number
  pnl30d: number
  roi7d: number
  roi30d: number
  positions: TraderPosition[]
  pnl30Series: PnlPoint[]
  joined: number
}

export type TraderFill = {
  id: string
  coin: string
  label: string
  side: "long" | "short"
  size: number
  price: number
  fee: number
  pnl: number
  dir: string
  time: number
}

export type JoinRow = {
  id: string
  trader: string
  sizeUsd: number
  createdAt: string
  traderPnl7d: number | null
  traderAccountValue: number | null
  positions: Array<{
    coin: string
    label: string
    side: "long" | "short"
    size: number
    leverage: number
    entryPx: number
    positionValue: number
    unrealizedPnl: number
    copiedSize: number
  }>
  actions: Array<{
    id: string
    coin: string
    traderAction: string
    ourAction: string
    ourSize: number
    side: string
    leverage: number
    status: string
    detail: string
    createdAt: string
  }>
}

export type FundPreview = {
  side: "deposit" | "withdraw"
  feeUsd: number
  receiveUsd: number
  receiveSol: number
  seconds: number
  sendSol: number
  sendUsd: number
}

export type DepositOpen = {
  id: string
  tx: string
  feeUsd: number
  receiveUsd: number
  seconds: number
}

export type DepositRun = {
  id: string
  stage: "swap" | "done" | "failed"
  message: string
  receiveUsd: number
}

export type WithdrawProgress = {
  id: string
  stage: "taking" | "sending" | "waiting" | "landed" | "failed" | "refunding"
  amountUsd: number
  sol: number
  txHash: string
  destination: string
  message: string
}

export type ActivityRow = {
  id: string
  kind: "deposit" | "withdraw"
  status: string
  amountUsd: number
  sol: number
  message: string
  createdAt: string
}

export const api = {
  nonce: (pubkey: string) =>
    request<{ nonce: string; message: string }>(`/auth/nonce?pubkey=${encodeURIComponent(pubkey)}`),
  verify: (body: { pubkey: string; nonce: string; signature: string }) =>
    request<{ token: string; user: { id: string; phantomPubkey: string; evmAddress: string | null } }>(
      "/auth/verify",
      { method: "POST", body: JSON.stringify(body) },
    ),
  me: () => request<{ id: string; phantomPubkey: string; evmAddress: string | null }>("/auth/me"),
  traders: () => request<{ traders: Trader[]; asOf: number }>("/traders"),
  trader: (address: string) =>
    request<{ trader: Trader; fills: TraderFill[]; asOf: number }>(`/traders/${address}`),
  joins: () => request<{ joins: JoinRow[] }>("/joins"),
  join: (body: { trader: string; sizeUsd: number }) =>
    request<{ id: string; trader: string; sizeUsd: number; status: string }>("/joins", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  stopJoin: (id: string) =>
    request<{ id: string; status: string }>(`/joins/${id}/stop`, { method: "POST", body: "{}" }),
  closeJoin: (id: string) =>
    request<{ id: string; status: string }>(`/joins/${id}/close`, { method: "POST", body: "{}" }),
  markets: () => request<{ markets: Market[] }>("/markets"),
  live: async () => normalizeLiveAccount(await request<LiveResponse>("/account/live")),
  liveOrder: (body: {
    coin: string
    side: "long" | "short"
    type: "market" | "limit"
    size: number
    price?: number
    mark: number
    leverage: number
    reduce?: boolean
  }) => request("/live/order", { method: "POST", body: JSON.stringify(body) }),
  livePreview: (body: { side: "deposit"; sol: number } | { side: "withdraw"; usd: number }) =>
    request<FundPreview>("/live/preview", { method: "POST", body: JSON.stringify(body) }),
  liveDepositOpen: (sol: number) =>
    request<DepositOpen>("/live/deposit/open", { method: "POST", body: JSON.stringify({ sol }) }),
  liveDepositSent: (id: string, txHash: string) =>
    request<{ id: string; stage: string }>(`/live/deposit/${id}/sent`, {
      method: "POST",
      body: JSON.stringify({ txHash }),
    }),
  liveDepositStatus: (id: string) => request<DepositRun>(`/live/deposit/${id}`),
  liveWithdraw: (amountUsd: number) =>
    request<WithdrawProgress>("/live/withdraw", { method: "POST", body: JSON.stringify({ amountUsd }) }),
  liveReturn: () =>
    request<{ returned: boolean; withdrawableUsd: number; message?: string }>("/live/return", {
      method: "POST",
      body: "{}",
    }),
  withdrawStatus: (id: string) => request<WithdrawProgress>(`/live/withdraw/${id}`),
  activity: () => request<{ activity: ActivityRow[] }>("/live/activity"),
}

export const toB64 = (bytes: ArrayLike<number>) => {
  const arr = bytes instanceof Uint8Array ? bytes : Uint8Array.from(Array.from(bytes))
  let out = ""
  for (let i = 0; i < arr.length; i += 1) out += String.fromCharCode(arr[i] ?? 0)
  return btoa(out)
}

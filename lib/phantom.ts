export type PhantomSolana = {
  isPhantom?: boolean
  isConnected?: boolean
  publicKey?: { toBase58: () => string }
  connect: (opts?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: { toBase58: () => string } }>
  disconnect: () => Promise<void>
  signMessage: (message: Uint8Array, display?: "utf8" | "hex") => Promise<{ signature: Uint8Array }>
  signAndSendTransaction: (transaction: unknown) => Promise<{ signature: string } | string>
  on: (event: string, handler: (...args: unknown[]) => void) => void
  off?: (event: string, handler: (...args: unknown[]) => void) => void
}

export type PhantomEthereum = {
  isPhantom?: boolean
  selectedAddress?: string | null
  request: <T = unknown>(payload: { method: string; params?: unknown[] }) => Promise<T>
  on?: (event: string, handler: (...args: unknown[]) => void) => void
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void
}

const fromWindow = (): PhantomSolana | null => {
  if (typeof window === "undefined") return null
  const phantom = (window as unknown as { phantom?: { solana?: PhantomSolana } }).phantom?.solana
  if (phantom?.isPhantom) return phantom
  const solana = (window as unknown as { solana?: PhantomSolana }).solana
  if (solana?.isPhantom) return solana
  return null
}

export const getPhantom = fromWindow

export const getPhantomEthereum = (): PhantomEthereum | null => {
  if (typeof window === "undefined") return null
  const ethereum = (window as unknown as {
    phantom?: { ethereum?: PhantomEthereum }
  }).phantom?.ethereum
  return ethereum?.isPhantom ? ethereum : null
}

export const peekEthereumAddress = () => {
  const provider = getPhantomEthereum()
  return provider?.selectedAddress || ""
}

export const connectPhantomEthereum = async () => {
  const provider = getPhantomEthereum()
  if (!provider) {
    throw new Error("This Phantom account is Solana only. Hyperliquid live mode needs an Ethereum address.")
  }
  if (provider.selectedAddress) return provider.selectedAddress
  try {
    const accounts = await provider.request<string[]>({ method: "eth_requestAccounts" })
    const address = accounts[0]
    if (!address) throw new Error("Phantom did not return an Ethereum address")
    return address
  } catch (error) {
    const text = phantomError(error)
    if (/unsupported account|doesn.?t support|trying to use ethereum|solana only/i.test(text)) {
      throw new Error("This Phantom account is Solana only. Hyperliquid live mode needs an Ethereum address.")
    }
    throw error
  }
}

export const waitForPhantom = (ms = 2500) =>
  new Promise<PhantomSolana | null>((resolve) => {
    const ready = fromWindow()
    if (ready) {
      resolve(ready)
      return
    }
    const finish = (found: PhantomSolana | null) => {
      window.clearTimeout(timer)
      window.removeEventListener("phantom#initialized", onReady)
      resolve(found)
    }
    const onReady = () => finish(fromWindow())
    const timer = window.setTimeout(() => finish(fromWindow()), ms)
    window.addEventListener("phantom#initialized", onReady)
  })

export const phantomInstallUrl = "https://phantom.app/download"

export const pubkeyOf = (key: { toBase58?: () => string; toString: () => string } | null | undefined) => {
  if (!key) return ""
  return key.toBase58?.() ?? key.toString()
}

export const readSignature = (signed: { signature?: ArrayLike<number> } | ArrayLike<number>) => {
  if (signed && typeof signed === "object" && "signature" in signed && signed.signature) {
    return signed.signature
  }
  return signed as ArrayLike<number>
}

const BASE58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"

const encodeBase58 = (bytes: Uint8Array) => {
  if (!bytes.length) return ""
  const digits = [0]
  for (const byte of bytes) {
    let carry = byte
    for (let index = 0; index < digits.length; index += 1) {
      carry += (digits[index] ?? 0) << 8
      digits[index] = carry % 58
      carry = Math.floor(carry / 58)
    }
    while (carry > 0) {
      digits.push(carry % 58)
      carry = Math.floor(carry / 58)
    }
  }
  let zeros = 0
  while (zeros < bytes.length && bytes[zeros] === 0) zeros += 1
  return "1".repeat(zeros) + digits.reverse().map((digit) => BASE58[digit] ?? "").join("")
}

export const signatureText = (sent: { signature?: string | ArrayLike<number> } | string | null | undefined) => {
  if (typeof sent === "string") return sent
  const signature = sent?.signature
  if (typeof signature === "string") return signature
  if (signature && typeof signature === "object") {
    return encodeBase58(signature instanceof Uint8Array ? signature : Uint8Array.from(Array.from(signature)))
  }
  return ""
}

export const rejectedByPhantom = (err: unknown) => {
  if (!err || typeof err !== "object") return false
  const record = err as { code?: number; message?: string }
  const code = Number(record.code ?? 0)
  const message = String(record.message ?? "")
  return code === 4001 || /reject|denied|cancel/i.test(message)
}

export const connectPhantom = async (provider: PhantomSolana) => {
  const read = () => pubkeyOf(provider.publicKey)
  try {
    const connected = await provider.connect()
    const pubkey = pubkeyOf(connected?.publicKey) || read()
    if (pubkey) return pubkey
  } catch (err) {
    const existing = read()
    if (existing && !rejectedByPhantom(err)) return existing
    if (rejectedByPhantom(err)) throw err
    await provider.disconnect().catch(() => undefined)
    const connected = await provider.connect()
    const pubkey = pubkeyOf(connected?.publicKey) || read()
    if (pubkey) return pubkey
    throw err
  }
  throw new Error("Phantom did not return a public key")
}

export const signPhantom = async (provider: PhantomSolana, message: string) => {
  const bytes = new TextEncoder().encode(message)
  try {
    return await provider.signMessage(bytes, "utf8")
  } catch (err) {
    if (rejectedByPhantom(err)) throw err
    return provider.signMessage(bytes)
  }
}

export const isEthereumUnavailable = (error?: unknown) => {
  if (!getPhantomEthereum()) return true
  if (error === undefined) return false
  const text = phantomError(error)
  return /solana only|ethereum address|unsupported account|trying to use ethereum|ethereum is off/i.test(text)
}

export const phantomError = (err: unknown) => {
  if (err instanceof TypeError && /fetch/i.test(err.message)) return "Could not reach joined.fun"
  if (!err || typeof err !== "object") return "Could not connect Phantom"
  const record = err as { code?: number; message?: string; data?: { message?: string } }
  const code = Number(record.code ?? 0)
  const message = [record.message, record.data?.message].filter(Boolean).join(" ")
  if (code === 4001 || /reject|denied|cancel/i.test(message)) return "Request rejected in Phantom"
  if (code === -32002 || /already (open|pending)|resource not available/i.test(message)) {
    return "Phantom is already asking for approval. Finish that prompt, then try again."
  }
  if (code === -32603 || /unexpected error/i.test(message)) {
    return "Unlock Phantom, then try connecting again."
  }
  if (/unsupported account|doesn.?t support|trying to use ethereum/i.test(message)) {
    return "This Phantom account is Solana only. Hyperliquid live mode needs an Ethereum address."
  }
  if (/solana only|ethereum address/i.test(message)) return message
  if (/not found|no provider|isPhantom/i.test(message)) return "Phantom is not installed"
  if (/failed to fetch|networkerror|load failed/i.test(message)) return "Could not reach joined.fun"
  if (/bad signature/i.test(message)) return "Could not complete the connection. Refresh the page and try again."
  return message || "Could not connect Phantom"
}

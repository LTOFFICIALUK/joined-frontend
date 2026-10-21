const fromEnv = (value: string | undefined) => {
  const trimmed = value?.trim().replace(/\/$/, "") ?? ""
  if (!/^https?:\/\//.test(trimmed) && !/^wss?:\/\//.test(trimmed)) return ""
  return trimmed
}

export const BRAND = {
  name: "joined",
  domain: "joined.fun",
  url: "https://joined.fun",
  tagline: "One trader. Everyone joins in.",
  description: "Pick a top stock trader on Hyperliquid. Join, and your Phantom wallet follows every trade they make.",
  x: "",
  ticker: "$JOINED",
  ca: "",
}

export const apiUrl =
  fromEnv(process.env.NEXT_PUBLIC_API_URL) ||
  (process.env.NODE_ENV === "development" ? "http://localhost:8080" : "")

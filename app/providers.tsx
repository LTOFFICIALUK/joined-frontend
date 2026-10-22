"use client"

import { createContext, useContext, useLayoutEffect, useMemo, useState } from "react"
import { api, clearToken, getToken, setToken, toB64 } from "@/lib/api"
import { getPhantom, phantomError, pubkeyOf, readSignature, waitForPhantom } from "@/lib/phantom"
import { useStream } from "@/lib/stream"

type Session = { pubkey: string; evm: string }

type SessionValue = {
  session: Session | null
  ready: boolean
  busy: boolean
  hint: string
  connect: () => Promise<boolean>
  disconnect: () => void
}

const SessionContext = createContext<SessionValue | null>(null)

export const useSession = () => {
  const value = useContext(SessionContext)
  if (!value) throw new Error("Session missing")
  return value
}

export const Providers = ({ children }: { children: React.ReactNode }) => {
  useStream()
  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [hint, setHint] = useState("")

  useLayoutEffect(() => {
    const token = getToken()
    if (!token) {
      setReady(true)
      return
    }
    void api.me()
      .then((me) => setSession({ pubkey: me.phantomPubkey, evm: me.evmAddress ?? "" }))
      .catch(() => clearToken())
      .finally(() => setReady(true))
  }, [])

  const value = useMemo<SessionValue>(() => ({
    session,
    ready,
    busy,
    hint,
    disconnect: () => {
      clearToken()
      setSession(null)
      setHint("")
    },
    connect: async () => {
      setBusy(true)
      setHint("Opening Phantom")
      try {
        const provider = (await waitForPhantom()) ?? getPhantom()
        if (!provider) {
          setHint("Phantom is not installed")
          return false
        }
        const connected = provider.isConnected && provider.publicKey
          ? { publicKey: provider.publicKey }
          : await provider.connect()
        const pubkey = pubkeyOf(connected.publicKey)
        if (!pubkey) throw new Error("Phantom did not return a public key")
        setHint("Sign the login message")
        const { nonce, message } = await api.nonce(pubkey)
        const signed = await provider.signMessage(new TextEncoder().encode(message), "utf8")
        const { token, user } = await api.verify({
          pubkey,
          nonce,
          signature: toB64(readSignature(signed)),
        })
        setToken(token)
        setSession({ pubkey: user.phantomPubkey, evm: user.evmAddress ?? "" })
        setHint("")
        return true
      } catch (err) {
        setHint(phantomError(err))
        return false
      } finally {
        setBusy(false)
      }
    },
  }), [busy, hint, session, ready])

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

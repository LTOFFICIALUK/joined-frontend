"use client"

import { createContext, useContext, useLayoutEffect, useMemo, useRef, useState } from "react"
import { api, clearToken, getToken, setToken, toB64 } from "@/lib/api"
import { connectPhantom, getPhantom, phantomError, readSignature, rejectedByPhantom, signPhantom, waitForPhantom, type PhantomSolana } from "@/lib/phantom"
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
  const flight = useRef<Promise<boolean> | null>(null)

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
    connect: () => {
      if (flight.current) return flight.current
      const run = (async () => {
        setBusy(true)
        setHint("Opening Phantom")
        try {
          const provider = (await waitForPhantom()) ?? getPhantom()
          if (!provider) {
            setHint("Phantom is not installed")
            return false
          }
          let pubkey = await connectPhantom(provider)
          setHint("Sign the login message")
          let issued = await api.nonce(pubkey)
          let signed: Awaited<ReturnType<PhantomSolana["signMessage"]>>
          try {
            signed = await signPhantom(provider, issued.message)
          } catch (err) {
            if (rejectedByPhantom(err)) throw err
            await provider.disconnect().catch(() => undefined)
            pubkey = await connectPhantom(provider)
            issued = await api.nonce(pubkey)
            signed = await signPhantom(provider, issued.message)
          }
          const { token, user } = await api.verify({
            pubkey,
            nonce: issued.nonce,
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
      })()
      flight.current = run
      void run.finally(() => {
        if (flight.current === run) flight.current = null
      })
      return run
    },
  }), [busy, hint, session, ready])

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

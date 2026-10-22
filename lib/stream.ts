"use client"

import { useEffect } from "react"
import type { TapePrint } from "./api"
import { wsUrl } from "./config"

export const useStream = () => {
  useEffect(() => {
    if (!wsUrl) return
    let socket: WebSocket | null = null
    let alive = true
    let timer = 0
    const connect = () => {
      socket = new WebSocket(wsUrl)
      socket.onopen = () => {
        socket?.send(JSON.stringify({ type: "watch", coin: "xyz:NVDA" }))
      }
      socket.onclose = () => {
        if (!alive) return
        timer = window.setTimeout(connect, 1500)
      }
    }
    connect()
    return () => {
      alive = false
      window.clearTimeout(timer)
      socket?.close()
    }
  }, [])
}

export const useTape = (onRows: (rows: TapePrint[]) => void, enabled: boolean) => {
  useEffect(() => {
    if (!wsUrl || !enabled) return
    let socket: WebSocket | null = null
    let alive = true
    let timer = 0
    const connect = () => {
      socket = new WebSocket(wsUrl)
      socket.onopen = () => {
        socket?.send(JSON.stringify({ type: "tape" }))
      }
      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(String(event.data)) as { type?: string; rows?: TapePrint[] }
          if (msg.type === "tape" && Array.isArray(msg.rows)) onRows(msg.rows)
        } catch {
          return
        }
      }
      socket.onclose = () => {
        if (!alive) return
        timer = window.setTimeout(connect, 1500)
      }
    }
    connect()
    return () => {
      alive = false
      window.clearTimeout(timer)
      socket?.close()
    }
  }, [enabled, onRows])
}

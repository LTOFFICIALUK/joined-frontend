"use client"

import { useEffect } from "react"
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

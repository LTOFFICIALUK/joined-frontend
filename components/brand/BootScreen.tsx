"use client"

import { useEffect, useRef } from "react"
import { BUBBLES } from "@/components/brand/Bubbles"

const WANDER_MS = 1700
const GATHER_MS = 1600
const DEPART_MS = 1100

const easeOut = (value: number) => 1 - (1 - value) ** 4

const wanderAt = (index: number, time: number) => {
  const angle = index * 2.399963
  const speed = 0.55 + (index % 5) * 0.09
  const amp = 34 + (index % 6) * 4
  return {
    left: 50 + Math.cos(angle + (time / 900) * speed) * amp,
    top: 46 + Math.sin(angle * 1.2 + (time / 1100) * speed) * amp * 0.82,
  }
}

const ringAt = (index: number, width: number, height: number) => {
  const bubble = BUBBLES[index]
  const reach = Math.min(width, height) * 0.2
  const radiusX = (reach / width) * 100
  const radiusY = (reach / height) * 100
  return {
    left: 50 + ((bubble.left - 50) / 42) * radiusX,
    top: 50 + ((bubble.top - 50) / 42) * radiusY,
  }
}

type BootScreenProps = {
  canDepart: boolean
  orbit: HTMLDivElement | null
  onDepart: () => void
  onDone: () => void
}

export const BootScreen = ({ canDepart, orbit, onDepart, onDone }: BootScreenProps) => {
  const dots = useRef<Array<HTMLSpanElement | null>>([])
  const mark = useRef<HTMLImageElement>(null)
  const word = useRef<HTMLParagraphElement>(null)
  const veil = useRef<HTMLDivElement>(null)
  const root = useRef<HTMLDivElement>(null)
  const departed = useRef(false)
  const canDepartRef = useRef(canDepart)
  const orbitRef = useRef(orbit)
  const onDepartRef = useRef(onDepart)
  const onDoneRef = useRef(onDone)
  canDepartRef.current = canDepart
  orbitRef.current = orbit
  onDepartRef.current = onDepart
  onDoneRef.current = onDone

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const started = performance.now()
    let frame = 0
    let finished = false
    const gatherStart = reduce ? 0 : WANDER_MS
    const gatherEnd = reduce ? 240 : WANDER_MS + GATHER_MS
    const departMs = reduce ? 200 : DEPART_MS
    let mode: "show" | "fly" = "show"
    let flyStart = 0
    const flyFrom: Array<{ x: number; y: number }> = []

    const place = (index: number, x: number, y: number, scale: number) => {
      const node = dots.current[index]
      if (!node) return
      node.style.position = "fixed"
      node.style.left = `${x}px`
      node.style.top = `${y}px`
      node.style.transform = `translate(-50%, -50%) scale(${scale})`
    }

    const orbitBox = () => {
      const node = orbitRef.current
      if (!node) return null
      const box = node.getBoundingClientRect()
      if (box.width < 20 || box.height < 20) return null
      return box
    }

    const slot = (index: number, box: DOMRect) => {
      const bubble = BUBBLES[index]
      return {
        x: box.left + (bubble.left / 100) * box.width,
        y: box.top + (bubble.top / 100) * box.height,
      }
    }

    const fadeCover = () => {
      onDepartRef.current()
      if (root.current) root.current.style.pointerEvents = "none"
      if (veil.current) veil.current.style.opacity = "0"
      if (mark.current) {
        mark.current.style.transition = "opacity 500ms ease"
        mark.current.style.opacity = "0"
      }
      if (word.current) {
        word.current.style.transition = "opacity 400ms ease"
        word.current.style.opacity = "0"
      }
    }

    const stageSize = () => {
      const box = root.current?.getBoundingClientRect()
      return {
        width: box?.width || window.innerWidth,
        height: box?.height || window.innerHeight,
      }
    }

    const centerPose = (index: number, time: number, width: number, height: number) => {
      const wander = wanderAt(index, Math.min(time, gatherStart))
      const fromX = (wander.left / 100) * width
      const fromY = (wander.top / 100) * height
      if (time <= gatherStart) {
        return { x: fromX, y: fromY, scale: 0.85 + Math.sin(time / 380 + index) * 0.12 }
      }
      const ring = ringAt(index, width, height)
      const progress = easeOut(Math.min(1, (time - gatherStart) / (gatherEnd - gatherStart)))
      const spin = time > gatherEnd ? (time - gatherEnd) / 16000 : 0
      const dx = ring.left - 50
      const dy = ring.top - 50
      const turnedLeft = 50 + dx * Math.cos(spin) - dy * Math.sin(spin)
      const turnedTop = 50 + dx * Math.sin(spin) + dy * Math.cos(spin)
      const left = wander.left + (turnedLeft - wander.left) * progress
      const top = wander.top + (turnedTop - wander.top) * progress
      return {
        x: (left / 100) * width,
        y: (top / 100) * height,
        scale: 0.7 + 0.3 * progress,
      }
    }

    const startFly = (now: number) => {
      const time = now - started
      const { width, height } = stageSize()
      for (let index = 0; index < BUBBLES.length; index += 1) {
        const pose = centerPose(index, time, width, height)
        flyFrom[index] = { x: pose.x, y: pose.y }
      }
      mode = "fly"
      flyStart = now
      fadeCover()
    }

    const paint = (now: number) => {
      if (finished) return
      const time = now - started
      const { width, height } = stageSize()

      if (mode === "fly") {
        const progress = easeOut(Math.min(1, (now - flyStart) / departMs))
        const box = orbitBox()
        for (let index = 0; index < BUBBLES.length; index += 1) {
          const from = flyFrom[index] ?? { x: width / 2, y: height / 2 }
          const next = box ? slot(index, box) : from
          place(index, from.x + (next.x - from.x) * progress, from.y + (next.y - from.y) * progress, 1)
        }
        if (progress < 1) {
          frame = window.requestAnimationFrame(paint)
          return
        }
        if (box) {
          for (let index = 0; index < BUBBLES.length; index += 1) {
            const next = slot(index, box)
            place(index, next.x, next.y, 1)
          }
        }
        finished = true
        onDoneRef.current()
        return
      }

      for (let index = 0; index < BUBBLES.length; index += 1) {
        const pose = centerPose(index, time, width, height)
        place(index, pose.x, pose.y, pose.scale)
      }

      const formed = Math.min(1, Math.max(0, (time - gatherStart) / Math.max(1, gatherEnd - gatherStart)))
      if (mark.current) {
        mark.current.style.opacity = String(formed)
        mark.current.style.transform = `translate(-50%, -50%) scale(${0.72 + formed * 0.28})`
      }
      if (word.current) word.current.style.opacity = String(formed)

      const gathered = time >= gatherEnd
      const waitedLongEnough = time > gatherEnd + 2200
      if (!departed.current && ((gathered && canDepartRef.current) || waitedLongEnough)) {
        departed.current = true
        startFly(now)
      }
      frame = window.requestAnimationFrame(paint)
    }

    const release = () => {
      if (departed.current || finished) return
      const elapsed = performance.now() - started
      const gathered = elapsed >= gatherEnd
      const waitedLongEnough = elapsed > gatherEnd + 2200
      if (!(gathered && canDepartRef.current) && !waitedLongEnough) return
      departed.current = true
      startFly(performance.now())
      frame = window.requestAnimationFrame(paint)
    }

    frame = window.requestAnimationFrame(paint)
    const watchdog = window.setInterval(release, 200)
    return () => {
      finished = true
      window.cancelAnimationFrame(frame)
      window.clearInterval(watchdog)
    }
  }, [])

  return (
    <div ref={root} className="fixed inset-0 z-[80] overflow-hidden" role="status" aria-live="polite" aria-label="Loading joined">
      <div ref={veil} className="absolute inset-0 bg-black transition-opacity duration-[1200ms] ease-out" />
      {BUBBLES.map((bubble, index) => {
        const start = wanderAt(index, 0)
        return (
          <span
            key={`${bubble.left}-${bubble.top}`}
            ref={(node) => {
              dots.current[index] = node
            }}
            className="absolute rounded-full"
            style={{
              left: `${start.left}%`,
              top: `${start.top}%`,
              width: bubble.size,
              height: bubble.size,
              background: bubble.color,
              opacity: bubble.opacity,
              transform: "translate(-50%, -50%)",
              boxShadow: bubble.size > 6 ? `0 0 ${bubble.size + 8}px rgba(80, 210, 193, 0.7)` : undefined,
            }}
          />
        )
      })}
      <img
        ref={mark}
        src="/brand/joined-mark-white.svg"
        alt=""
        className="absolute left-1/2 top-1/2 h-24 w-24 sm:h-28 sm:w-28"
        style={{ opacity: 0, transform: "translate(-50%, -50%) scale(0.72)" }}
      />
      <p
        ref={word}
        className="absolute left-1/2 top-[calc(50%+7.5rem)] -translate-x-1/2 font-display text-3xl font-extrabold tracking-tight text-paper"
        style={{ opacity: 0 }}
      >
        joined
      </p>
    </div>
  )
}

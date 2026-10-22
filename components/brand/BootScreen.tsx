"use client"

import { useEffect, useRef } from "react"
import { BUBBLES } from "@/components/brand/Bubbles"

const WANDER_MS = 1700
const GATHER_MS = 1600

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

    const beginDepart = () => {
      fadeCover()
      window.setTimeout(() => onDoneRef.current(), reduce ? 200 : 680)
    }

    const paint = (now: number) => {
      if (finished) return
      const time = now - started
      const width = window.innerWidth
      const height = window.innerHeight
      const box = orbitBox()
      const gathering = time > gatherStart && Boolean(box)

      for (let index = 0; index < BUBBLES.length; index += 1) {
        const wander = wanderAt(index, Math.min(time, gatherStart))
        const fromX = (wander.left / 100) * width
        const fromY = (wander.top / 100) * height
        if (!gathering || !box) {
          const scale = 0.85 + Math.sin(time / 380 + index) * 0.12
          place(index, fromX, fromY, scale)
          continue
        }
        const next = slot(index, box)
        const progress = easeOut(Math.min(1, (time - gatherStart) / (gatherEnd - gatherStart)))
        place(
          index,
          fromX + (next.x - fromX) * progress,
          fromY + (next.y - fromY) * progress,
          0.7 + 0.3 * progress,
        )
      }

      const formed = Math.min(1, Math.max(0, (time - gatherStart) / Math.max(1, gatherEnd - gatherStart)))
      if (mark.current) {
        mark.current.style.opacity = String(formed)
        mark.current.style.transform = `translate(-50%, -50%) scale(${0.72 + formed * 0.28})`
      }
      if (word.current) word.current.style.opacity = String(formed)

      const elapsed = now - started
      const gathered = Boolean(orbitBox()) && elapsed >= gatherEnd
      const waitedLongEnough = elapsed > gatherEnd + 2200
      if (!departed.current && ((gathered && canDepartRef.current) || waitedLongEnough)) {
        finished = true
        departed.current = true
        beginDepart()
        return
      }
      frame = window.requestAnimationFrame(paint)
    }

    const release = () => {
      if (departed.current || finished) return
      const elapsed = performance.now() - started
      const gathered = Boolean(orbitBox()) && elapsed >= gatherEnd
      const waitedLongEnough = elapsed > gatherEnd + 2200
      if (!(gathered && canDepartRef.current) && !waitedLongEnough) return
      finished = true
      departed.current = true
      beginDepart()
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

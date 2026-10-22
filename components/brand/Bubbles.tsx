type Bubble = {
  left: number
  top: number
  size: number
  opacity: number
  color: string
}

export const BUBBLES: Bubble[] = [
  { left: 50, top: 8, size: 4, opacity: 0.35, color: "#7EE8DC" },
  { left: 58, top: 11, size: 7, opacity: 0.85, color: "#50D2C1" },
  { left: 66, top: 9, size: 3, opacity: 0.4, color: "#1C7A6E" },
  { left: 73, top: 16, size: 5, opacity: 0.55, color: "#2EAA98" },
  { left: 81, top: 14, size: 9, opacity: 0.95, color: "#50D2C1" },
  { left: 88, top: 22, size: 4, opacity: 0.35, color: "#7EE8DC" },
  { left: 92, top: 31, size: 6, opacity: 0.7, color: "#50D2C1" },
  { left: 86, top: 28, size: 3, opacity: 0.3, color: "#1C7A6E" },
  { left: 94, top: 42, size: 11, opacity: 1, color: "#50D2C1" },
  { left: 90, top: 50, size: 4, opacity: 0.4, color: "#7EE8DC" },
  { left: 84, top: 57, size: 6, opacity: 0.65, color: "#2EAA98" },
  { left: 91, top: 62, size: 3, opacity: 0.35, color: "#1C7A6E" },
  { left: 80, top: 68, size: 8, opacity: 0.9, color: "#50D2C1" },
  { left: 72, top: 74, size: 5, opacity: 0.5, color: "#7EE8DC" },
  { left: 76, top: 82, size: 4, opacity: 0.35, color: "#1C7A6E" },
  { left: 64, top: 86, size: 10, opacity: 0.95, color: "#50D2C1" },
  { left: 58, top: 90, size: 3, opacity: 0.3, color: "#7EE8DC" },
  { left: 50, top: 84, size: 6, opacity: 0.6, color: "#2EAA98" },
  { left: 44, top: 91, size: 4, opacity: 0.4, color: "#50D2C1" },
  { left: 36, top: 86, size: 8, opacity: 0.85, color: "#50D2C1" },
  { left: 30, top: 78, size: 5, opacity: 0.45, color: "#7EE8DC" },
  { left: 22, top: 80, size: 3, opacity: 0.3, color: "#1C7A6E" },
  { left: 16, top: 70, size: 13, opacity: 1, color: "#50D2C1" },
  { left: 12, top: 60, size: 4, opacity: 0.4, color: "#2EAA98" },
  { left: 18, top: 52, size: 6, opacity: 0.7, color: "#50D2C1" },
  { left: 8, top: 46, size: 4, opacity: 0.35, color: "#7EE8DC" },
  { left: 14, top: 38, size: 8, opacity: 0.8, color: "#50D2C1" },
  { left: 10, top: 28, size: 3, opacity: 0.3, color: "#1C7A6E" },
  { left: 20, top: 22, size: 6, opacity: 0.55, color: "#2EAA98" },
  { left: 28, top: 16, size: 4, opacity: 0.4, color: "#7EE8DC" },
  { left: 36, top: 12, size: 9, opacity: 0.9, color: "#50D2C1" },
  { left: 44, top: 14, size: 3, opacity: 0.35, color: "#1C7A6E" },
  { left: 62, top: 20, size: 4, opacity: 0.45, color: "#50D2C1" },
  { left: 70, top: 36, size: 3, opacity: 0.3, color: "#7EE8DC" },
  { left: 68, top: 48, size: 5, opacity: 0.5, color: "#2EAA98" },
  { left: 34, top: 40, size: 4, opacity: 0.35, color: "#1C7A6E" },
  { left: 32, top: 62, size: 6, opacity: 0.6, color: "#50D2C1" },
  { left: 48, top: 72, size: 3, opacity: 0.3, color: "#7EE8DC" },
  { left: 56, top: 66, size: 5, opacity: 0.45, color: "#2EAA98" },
]

export const BubbleField = () => (
  <div className="pointer-events-none absolute inset-0 motion-safe:animate-orbit" aria-hidden="true">
    {BUBBLES.map((bubble, index) => (
      <span
        key={`${bubble.left}-${bubble.top}`}
        className="absolute rounded-full motion-safe:animate-breathe"
        style={{
          left: `${bubble.left}%`,
          top: `${bubble.top}%`,
          width: bubble.size,
          height: bubble.size,
          background: bubble.color,
          opacity: bubble.opacity,
          transform: "translate(-50%, -50%)",
          boxShadow: bubble.size > 6 ? `0 0 ${bubble.size + 6}px rgba(80, 210, 193, 0.65)` : undefined,
          animationDelay: `${index * 180}ms`,
        }}
      />
    ))}
  </div>
)

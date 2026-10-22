import { avatarDots } from "@/lib/traderStyle"

export const Avatar = ({ address }: { address: string }) => (
  <span className="relative inline-block h-9 w-9 shrink-0 overflow-hidden rounded-full bg-ink" aria-hidden="true">
    {avatarDots(address).map((dot) => (
      <span
        key={`${dot.left}-${dot.top}`}
        className="absolute rounded-full"
        style={{
          left: `${dot.left}%`,
          top: `${dot.top}%`,
          width: dot.size,
          height: dot.size,
          background: dot.color,
          transform: "translate(-50%, -50%)",
        }}
      />
    ))}
  </span>
)

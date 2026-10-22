import { BubbleField } from "@/components/brand/Bubbles"

export const Hold = () => (
  <div className="relative mx-auto h-72 w-72" role="status" aria-label="Loading joined">
    <BubbleField />
    <img
      src="/brand/joined-mark-white.svg"
      alt=""
      className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2"
    />
  </div>
)

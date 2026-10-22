import type { Metadata } from "next"

export const metadata: Metadata = {
  title: { absolute: "joined: How it works" },
  description: "How a join copies the next stock trade, and which fees are charged.",
}

const blocks = [
  {
    title: "The steps",
    body: "Pick a trader. Choose a size and a leverage cap. Connect Phantom. The login message does not send funds. If the Hyperliquid account is short on USDC, send SOL. Relay bridges it, and the fee is shown before you confirm. Confirm the join. Copying starts from the next stock trade. Positions already open stay on the trader's book.",
  },
  {
    title: "Opens, adds, cuts, closes",
    body: "When the trader opens a stock perp, your account opens the same market and side, sized to your join, at or under your cap. An add increases your copied size in proportion. A cut reduces it. A close reduces the copied size to zero. Orders under $10 wait until they add up.",
  },
  {
    title: "Liquidation",
    body: "Hyperliquid can liquidate a position if the move uses up the margin. The join preview states the move that would wipe the size you picked at the leverage you will actually use.",
  },
  {
    title: "Leverage caps",
    body: "Your cap is the highest leverage a copy will use. If the trader uses more, your copy uses the cap. Max follows the trader, still within the market maximum.",
  },
  {
    title: "Withdrawals",
    body: "Free USDC can be withdrawn back to SOL in Phantom. Open positions stay until you close them or you choose Stop and close.",
  },
  {
    title: "Fees",
    body: "joined does not charge a copy fee. Nothing from a copied trade is sent to joined. Relay charges the bridge fee shown before a SOL deposit or a withdrawal, and that fee goes to Relay. Hyperliquid charges its own trading fee on each order, and that fee stays on Hyperliquid.",
  },
]

export default function HowPage() {
  return (
    <section className="max-w-2xl">
      <h1 className="font-display text-4xl font-extrabold">How it works</h1>
      <div className="mt-6 space-y-6">
        {blocks.map((block) => (
          <article key={block.title}>
            <h2 className="font-display text-xl font-bold">{block.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-paper">{block.body}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

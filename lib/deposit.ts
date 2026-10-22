import { VersionedTransaction } from "@solana/web3.js"
import { api } from "@/lib/api"
import { getPhantom, signatureText, waitForPhantom } from "@/lib/phantom"

export const depositSol = async (sol: number, onStatus: (message: string) => void) => {
  if (!(sol > 0)) throw new Error("Enter how much SOL to send.")
  onStatus("Opening the swap. Phantom will ask you to send the SOL.")
  const created = await api.liveDepositOpen(sol)
  const provider = (await waitForPhantom()) ?? getPhantom()
  if (!provider) throw new Error("Reconnect Phantom to send SOL.")
  onStatus("Confirm the SOL send in Phantom.")
  const bytes = Uint8Array.from(atob(created.tx), (char) => char.charCodeAt(0))
  let transaction: VersionedTransaction
  try {
    transaction = VersionedTransaction.deserialize(bytes)
  } catch {
    throw new Error("Could not prepare the SOL transfer.")
  }
  const sent = await provider.signAndSendTransaction(transaction)
  const txHash = signatureText(sent)
  if (txHash.length < 32) throw new Error("Phantom did not return the transaction.")
  await api.liveDepositSent(created.id, txHash)
  onStatus("SOL is on the way. USDC is usually ready in a few seconds.")
  let latest = "SOL is on the way. USDC is usually ready in a few seconds."
  for (let attempt = 0; attempt < 20; attempt += 1) {
    await new Promise((resolve) => window.setTimeout(resolve, 2000))
    const status = await api.liveDepositStatus(created.id)
    latest = status.message
    onStatus(status.message)
    if (status.stage === "done" || status.stage === "failed") break
  }
  return latest
}

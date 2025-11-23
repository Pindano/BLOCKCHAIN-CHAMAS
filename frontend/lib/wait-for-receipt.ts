// lib/wait-for-receipt.ts
import { createPublicClient, http } from "viem"
import { baseSepolia } from "viem/chains"

/**
 * Wait for transaction receipt using viem public client
 */
export async function waitForReceipt(txHash: `0x${string}`) {
    const client = createPublicClient({
        chain: baseSepolia,
        transport: http()
    })

    const receipt = await client.waitForTransactionReceipt({
        hash: txHash,
        confirmations: 1
    })

    return receipt
}

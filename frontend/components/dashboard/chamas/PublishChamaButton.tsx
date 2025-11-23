"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Rocket, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useEvmAddress, useSendEvmTransaction } from "@coinbase/cdp-hooks"
import { useWaitForTransactionReceipt } from "wagmi"
import { encodeCreateChama, extractAddressesFromLogs } from "@/lib/blockchain-encoding"
import { CHAMA_FACTORY_ABI } from "@/lib/contract-abis"
import { BLOCKCHAIN_CONFIG } from "@/lib/blockchain-config"
import { getSupabaseClient } from "@/lib/supabase-client"

interface PublishChamaButtonProps {
    chamaId: string
    chamaName: string
    onPublished?: () => void
}

export function PublishChamaButton({ chamaId, chamaName, onPublished }: PublishChamaButtonProps) {
    const [publishing, setPublishing] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined)
    const { evmAddress } = useEvmAddress()
    const { sendEvmTransaction } = useSendEvmTransaction()
    const supabase = getSupabaseClient()

    const { data: receipt } = useWaitForTransactionReceipt({
        hash: txHash,
        chainId: BLOCKCHAIN_CONFIG.CHAIN_ID,
    })

    // Process receipt when available
    useEffect(() => {
        if (!receipt || !txHash) return

        const processReceipt = async () => {
            try {
                // Extract governor and token addresses from logs
                const { governor, token } = extractAddressesFromLogs(
                    receipt,
                    CHAMA_FACTORY_ABI,
                    "ChamaCreated"
                )

                // Update Chama status to published with blockchain details
                const { error: updateError } = await supabase
                    .from("chamas")
                    .update({
                        status: "published",
                        governor_address: governor,
                        membership_token_address: token,
                        on_chain_tx_hash: txHash,
                        on_chain_published_at: new Date().toISOString()
                    })
                    .eq("chama_id", chamaId)

                if (updateError) {
                    console.error("Error updating Chama:", updateError)
                    toast.error("Failed to update Chama status")
                    return
                }

                // Send notifications via API
                await fetch("/api/chamas/publish/notify", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ chamaId }),
                })

                toast.success(`${chamaName} has been published on-chain!`)
                setPublishing(false)
                setShowConfirm(false)
                onPublished?.()
            } catch (error: any) {
                console.error("Error processing receipt:", error)
                toast.error("Failed to complete publishing")
                setPublishing(false)
            }
        }

        processReceipt()
    }, [receipt, txHash, chamaId, chamaName, onPublished, supabase])

    const handlePublish = async () => {
        if (!evmAddress) {
            toast.error("Please connect your wallet first")
            return
        }

        setPublishing(true)
        const toastId = toast.loading("Publishing Chama to blockchain...")

        try {
            // Fetch Chama details and members
            const { data: chama, error: chamaError } = await supabase
                .from("chamas")
                .select("*, metadata")
                .eq("chama_id", chamaId)
                .single()

            if (chamaError || !chama) {
                throw new Error("Chama not found")
            }

            // Get all members with wallet addresses
            const { data: members, error: membersError } = await supabase
                .from("chama_members")
                .select("users(wallet_address)")
                .eq("chama_id", chamaId)

            if (membersError || !members || members.length === 0) {
                throw new Error("No members found")
            }

            // Extract wallet addresses
            const founderAddresses = members
                .map((m: any) => m.users?.wallet_address)
                .filter((addr: string | null) => addr !== null) as string[]

            if (founderAddresses.length === 0) {
                throw new Error("No members have connected wallets. All members must connect wallets before publishing.")
            }

            const constitution = chama.metadata?.constitution
            if (!constitution) {
                throw new Error("Constitution not found")
            }

            // Encode the createChama transaction
            const { to, data } = encodeCreateChama(
                constitution.chamaName,
                constitution.currency || "USDC",
                founderAddresses,
                founderAddresses[0] // First founder as bank observer
            )

            // Send transaction using CDP SDK
            const { transactionHash } = await sendEvmTransaction({
                evmAccount: evmAddress,
                transaction: {
                    to: to as `0x${string}`,
                    data: data as `0x${string}`,
                    value: BigInt(0),
                    chainId: BLOCKCHAIN_CONFIG.CHAIN_ID,
                    type: "eip1559",
                },
                network: "base-sepolia",
            })

            setTxHash(transactionHash)
            toast.info("Transaction sent! Waiting for confirmation...", { id: toastId })
        } catch (error: any) {
            console.error("Error publishing Chama:", error)
            toast.error(error.message || "Failed to publish Chama", { id: toastId })
            setPublishing(false)
        }
    }

    return (
        <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
            <DialogTrigger asChild>
                <Button size="lg" className="gap-2" disabled={publishing}>
                    {publishing ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Publishing...
                        </>
                    ) : (
                        <>
                            <Rocket className="w-5 h-5" />
                            Publish Chama
                        </>
                    )}
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Publish {chamaName} on-chain?</DialogTitle>
                    <DialogDescription>
                        This will deploy the Chama to the blockchain with all accepted members as founders.
                        This action cannot be undone. Make sure all members have reviewed and accepted the constitution.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setShowConfirm(false)} disabled={publishing}>
                        Cancel
                    </Button>
                    <Button onClick={handlePublish} disabled={publishing}>
                        {publishing ? "Publishing..." : "Publish to Blockchain"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

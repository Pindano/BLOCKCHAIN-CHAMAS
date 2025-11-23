// components/dashboard/proposals/QuickVoteButtons.tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ThumbsUp, ThumbsDown, Minus, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useUser } from "@/lib/UserContext"
import { useEvmAddress, useSendEvmTransaction } from "@coinbase/cdp-hooks"
import { encodeCastVote } from "@/lib/blockchain-encoding"
import { BLOCKCHAIN_CONFIG } from "@/lib/blockchain-config"
import { CHAMA_GOVERNOR_ABI } from "@/lib/contract-abis"
import { ethers } from "ethers"
import { getSupabaseClient } from "@/lib/supabase-client"

interface QuickVoteButtonsProps {
    proposalId: string
    governorAddress: string
    onChainProposalId: string
    isVotingActive: boolean
    hasVoted?: boolean
    compact?: boolean
}

export function QuickVoteButtons({
    proposalId,
    governorAddress,
    onChainProposalId,
    isVotingActive,
    hasVoted = false,
    compact = false
}: QuickVoteButtonsProps) {
    const { user } = useUser()
    const { evmAddress } = useEvmAddress()
    const { sendEvmTransaction: sendTx } = useSendEvmTransaction()
    const [voting, setVoting] = useState(false)
    const [votedChoice, setVotedChoice] = useState<string | null>(null)
    const supabase = getSupabaseClient()

    const handleVote = async (choice: "for" | "against" | "abstain") => {
        if (!user || !evmAddress || hasVoted || voting) return

        // Validate on-chain proposal ID
        if (!onChainProposalId || onChainProposalId === "pending…" || onChainProposalId === "") {
            toast.error("Cannot vote", { description: "Proposal not confirmed on-chain yet." })
            return
        }

        const toastId = toast.loading(`Casting vote (${choice})...`)
        setVoting(true)

        try {
            const proposalIdBigInt = BigInt(onChainProposalId)
            const supportValue = choice === "for" ? 1 : choice === "against" ? 0 : 2

            // Check proposal state on-chain
            const provider = new ethers.JsonRpcProvider(BLOCKCHAIN_CONFIG.RPC_URL)
            const governor = new ethers.Contract(governorAddress, CHAMA_GOVERNOR_ABI, provider)

            const state = await governor.state(proposalIdBigInt)
            if (state !== 1) {
                throw new Error("Voting is not active for this proposal")
            }

            // Check if user already voted
            const hasVotedOnChain = await governor.hasVoted(proposalIdBigInt, evmAddress)
            if (hasVotedOnChain) {
                throw new Error("You have already voted on this proposal")
            }

            // Check voting power
            const votingPower = await governor.getVotes(evmAddress, await provider.getBlockNumber() - 1)
            if (votingPower === 0n) {
                throw new Error("You have no voting power")
            }

            // Encode and send transaction
            const { to, data } = encodeCastVote(governorAddress, proposalIdBigInt, supportValue)

            const { transactionHash } = await sendTx({
                transaction: { to, data, value: BigInt(0), chainId: 84532, type: "eip1559" },
                evmAccount: evmAddress,
                network: "base-sepolia",
            })

            // Record vote in database
            await supabase.from("votes").insert({
                proposal_id: proposalId,
                user_id: user.user_id,
                vote: choice,
                vote_value: supportValue,
                on_chain_tx_hash: transactionHash,
            })

            toast.success(`Voted ${choice.toUpperCase()}!`, { id: toastId })
            setVotedChoice(choice)

            // Refresh the page to show updated vote
            setTimeout(() => window.location.reload(), 1500)
        } catch (error: any) {
            console.error("Vote error:", error)
            toast.error(error.message || "Failed to vote", { id: toastId })
        } finally {
            setVoting(false)
        }
    }

    if (!isVotingActive) {
        return (
            <div className="text-xs text-muted-foreground">
                {compact ? "Ended" : "Voting has ended"}
            </div>
        )
    }

    if (hasVoted || votedChoice) {
        return (
            <div className="text-xs text-green-600 font-medium">
                ✓ Voted {votedChoice || ""}
            </div>
        )
    }

    if (compact) {
        return (
            <div className="flex gap-1">
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleVote("for")}
                    disabled={voting}
                    className="gap-1 h-7 px-2 text-xs"
                >
                    <ThumbsUp className="w-3 h-3" />
                    For
                </Button>
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleVote("against")}
                    disabled={voting}
                    className="gap-1 h-7 px-2 text-xs"
                >
                    <ThumbsDown className="w-3 h-3" />
                    Against
                </Button>
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleVote("abstain")}
                    disabled={voting}
                    className="gap-1 h-7 px-2 text-xs"
                >
                    <Minus className="w-3 h-3" />
                    Abstain
                </Button>
            </div>
        )
    }

    return (
        <div className="flex gap-3">
            <Button
                onClick={() => handleVote("for")}
                disabled={voting}
                className="flex-1 gap-2"
                variant="default"
            >
                {voting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsUp className="w-4 h-4" />}
                Vote For
            </Button>
            <Button
                onClick={() => handleVote("against")}
                disabled={voting}
                className="flex-1 gap-2"
                variant="destructive"
            >
                {voting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsDown className="w-4 h-4" />}
                Vote Against
            </Button>
            <Button
                onClick={() => handleVote("abstain")}
                disabled={voting}
                className="flex-1 gap-2"
                variant="outline"
            >
                {voting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Minus className="w-4 h-4" />}
                Abstain
            </Button>
        </div>
    )
}

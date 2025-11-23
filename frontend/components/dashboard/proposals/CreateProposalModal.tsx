// components/dashboard/proposals/CreateProposalModal.tsx
"use client"

import { useState } from "react"
import { useUser } from "@/lib/UserContext"
import { getSupabaseClient } from "@/lib/supabase-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { uploadProposalToIPFS } from "@/app/actions/ipfs"
import { useEvmAddress, useSendEvmTransaction } from "@coinbase/cdp-hooks"
import { encodeCreateProposal } from "@/lib/blockchain-encoding"
import { ethers } from "ethers"

interface CreateProposalModalProps {
    isOpen?: boolean
    onClose?: () => void
    chamaId?: string
    chamaName?: string
    governorAddress?: string
}

export function CreateProposalModal({
    isOpen: controlledOpen,
    onClose,
    chamaId: preFillChamaId,
    chamaName: preFillChamaName,
    governorAddress: preFillGovernorAddress
}: CreateProposalModalProps = {}) {
    const { user } = useUser()
    const { evmAddress } = useEvmAddress()
    const { sendEvmTransaction: sendTx } = useSendEvmTransaction()
    const [internalOpen, setInternalOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [chamas, setChamas] = useState<any[]>([])
    const [formData, setFormData] = useState({
        chama_id: preFillChamaId || "",
        title: "",
        description: "",
        proposal_type: "STANDARD"
    })

    const supabase = getSupabaseClient()

    // Use controlled open state if provided, otherwise use internal state
    const open = controlledOpen !== undefined ? controlledOpen : internalOpen
    const setOpen = onClose ? (value: boolean) => !value && onClose() : setInternalOpen

    const handleOpenChange = async (isOpen: boolean) => {
        setOpen(isOpen)
        if (isOpen && user) {
            const { data } = await supabase
                .from("chama_members")
                .select("chama_id, chamas(chama_id, name)")
                .eq("user_id", user.user_id)

            if (data) {
                setChamas(data.map((m: any) => m.chamas).filter(Boolean))
            }
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!user || !formData.chama_id || !formData.proposal_type || !evmAddress || !sendTx) {
            toast.error("Missing required data. Please try again.")
            return
        }

        if (!formData.title || !formData.description) {
            toast.error("Please fill in all required fields")
            return
        }

        const toastId = toast.loading("Submitting proposal...")
        setLoading(true)

        try {
            // Prepare proposal data
            const proposalData = {
                title: formData.title,
                description: formData.description,
                proposalType: formData.proposal_type,
                creator: user.user_id,
                createdAt: new Date().toISOString(),
            }

            const ipfsHash = await uploadProposalToIPFS(proposalData)

            const { data: newProposal, error: insertError } = await supabase
                .from("proposals")
                .insert({
                    chama_id: formData.chama_id,
                    creator_id: user.user_id,
                    title: formData.title,
                    description: formData.description,
                    proposal_type: formData.proposal_type,
                    voting_start: new Date(),
                    voting_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    ipfs_hash: ipfsHash,
                })
                .select()
                .single()

            if (insertError) throw insertError

            const { data: chamaData } = await supabase
                .from("chamas")
                .select("name, governor_address")
                .eq("chama_id", formData.chama_id)
                .single()

            if (!chamaData?.governor_address) throw new Error("Chama governor address not found.")

            const targets = [chamaData.governor_address]
            const values = [0n]
            const calldatas = ["0x"]
            const descriptionHash = ethers.keccak256(ethers.toUtf8Bytes(`ipfs://${ipfsHash}`))

            const { to, data } = encodeCreateProposal(chamaData.governor_address, targets, values, calldatas, descriptionHash)

            const result = await sendTx({
                transaction: { to, data, value: BigInt(0), chainId: 84532, type: "eip1559" },
                evmAccount: evmAddress,
                network: "base-sepolia",
            })

            const txHash = result.transactionHash as `0x${string}`

            toast.info("Transaction sent! Waiting for confirmation...", {
                id: toastId,
            })

            // Wait for transaction receipt to get on-chain proposal ID
            const { waitForReceipt } = await import("@/lib/wait-for-receipt")
            const receipt = await waitForReceipt(txHash)

            // Extract on-chain proposal ID from logs
            const { extractProposalIdFromLogs } = await import("@/lib/blockchain-encoding")
            const { CHAMA_GOVERNOR_ABI } = await import("@/lib/contract-abis")
            const onChainProposalId = extractProposalIdFromLogs(receipt, CHAMA_GOVERNOR_ABI)

            // Update with transaction hash and on-chain proposal ID
            await supabase
                .from("proposals")
                .update({
                    transaction_hash: txHash,
                    on_chain_proposal_id: onChainProposalId
                })
                .eq("proposal_id", newProposal.proposal_id)

            toast.success("Proposal published on-chain!", {
                id: toastId,
                description: `Proposal ID: ${onChainProposalId.slice(0, 10)}...`,
            })

            setFormData({
                chama_id: "",
                title: "",
                description: "",
                proposal_type: "STANDARD"
            })
            setOpen(false)

            setTimeout(() => {
                window.location.href = `/dashboard/proposals/${newProposal.proposal_id}`
            }, 1000)

        } catch (error: any) {
            toast.error("Error submitting proposal", { id: toastId, description: error.message })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button size="lg" className="gap-2 shadow-lg">
                    <Plus className="w-5 h-5" />
                    <span className="hidden sm:inline">New Proposal</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create New Proposal</DialogTitle>
                    <DialogDescription>
                        Submit a proposal for your Chama members to vote on
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="chama_id">Chama *</Label>
                        <Select
                            value={formData.chama_id}
                            onValueChange={(value) => setFormData({ ...formData, chama_id: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a Chama" />
                            </SelectTrigger>
                            <SelectContent>
                                {chamas.map((chama) => (
                                    <SelectItem key={chama.chama_id} value={chama.chama_id}>
                                        {chama.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="proposal_type">Type *</Label>
                        <Select
                            value={formData.proposal_type}
                            onValueChange={(value) => setFormData({ ...formData, proposal_type: value })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="STANDARD">Standard Proposal</SelectItem>
                                <SelectItem value="CONSTITUTION_EDIT">Constitution Edit</SelectItem>
                                <SelectItem value="CONTRIBUTION_RECONCILIATION">Contribution Reconciliation</SelectItem>
                                <SelectItem value="LOAN_REQUEST">Loan Request</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="title">Title *</Label>
                        <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Brief, descriptive title"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description *</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Detailed description of your proposal..."
                            rows={6}
                            required
                        />
                    </div>

                    {!evmAddress && (
                        <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800">
                            <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                ⚠️ Please connect your wallet to submit proposals on-chain
                            </p>
                        </div>
                    )}

                    <div className="flex gap-2 justify-end pt-4">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading || !evmAddress}>
                            {loading ? "Submitting..." : "Create & Submit On-Chain"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}

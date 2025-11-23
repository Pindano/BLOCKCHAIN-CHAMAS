"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import { format } from "date-fns"
import { getSupabaseClient } from "@/lib/supabase-client"
import { decodeEventLog } from 'viem'
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { useUser } from "@/lib/UserContext"
import { useChamaGovernor } from "@/hooks/useChamaGovernor"
import { cn } from "@/lib/utils"

interface Member {
    user_id: string
    email: string
    wallet_address: string | null
}

interface ContributionEntry {
    user_id: string
    memberName: string
    amount: number
    reference: string
    date: Date
    notes: string
    included: boolean
}

export default function ReconciliationPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const chamaId = searchParams.get("chamaId")
    const { user } = useUser()

    const [chamaName, setChamaName] = useState("")
    const [governorAddress, setGovernorAddress] = useState<string | null>(null)
    const [members, setMembers] = useState<Member[]>([])
    const [contributions, setContributions] = useState<ContributionEntry[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [expectedAmount] = useState(5000) // Hardcoded for now
    const [publishedIpfsHash, setPublishedIpfsHash] = useState<string | null>(null)

    // Blockchain proposal submission
    const { propose, isPending, isConfirming, isSuccess, receipt } = useChamaGovernor(governorAddress as `0x${string}`)

    useEffect(() => {
        if (!chamaId) {
            router.push("/dashboard")
            return
        }

        const fetchData = async () => {
            try {
                // Fetch chama details
                const { data: chamaData } = await supabase
                    .from("chamas")
                    .select("name, governor_address")
                    .eq("chama_id", chamaId)
                    .single()

                if (chamaData) {
                    setGovernorAddress(chamaData.governor_address)
                    setChamaName(chamaData.name)
                }

                // Fetch chama members
                const { data: membersData, error: membersError } = await supabase
                    .from("chama_members")
                    .select(`
                        user_id,
                        users (
                            email,
                            wallet_address
                        )
                    `)
                    .eq("chama_id", chamaId)

                if (membersError) throw membersError

                const membersList: Member[] = membersData?.map((m: any) => ({
                    user_id: m.user_id,
                    email: m.users?.email || "Unknown",
                    wallet_address: m.users?.wallet_address || null
                })) || []

                setMembers(membersList)

                // Pre-fill contributions with expected amounts
                const today = new Date()
                const prefilled: ContributionEntry[] = membersList.map(member => ({
                    user_id: member.user_id,
                    memberName: member.email.split('@')[0], // Get name before @
                    amount: expectedAmount,
                    reference: "",
                    date: today,
                    notes: "Monthly contribution",
                    included: true // All checked by default
                }))

                setContributions(prefilled)
            } catch (error) {
                console.error("Error fetching data:", error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [chamaId, router])

    // Handle blockchain transaction success
    useEffect(() => {
        if (isSuccess && receipt && publishedIpfsHash) {
            const syncToSupabase = async () => {
                try {
                    // Find ProposalCreated event from receipt logs
                    const event = receipt.logs.find(log => {
                        try {
                            const { ethers } = require('ethers')
                            const CHAMA_GOVERNOR_ABI = require('@/lib/contract-abis').CHAMA_GOVERNOR_ABI
                            const iface = new ethers.Interface(CHAMA_GOVERNOR_ABI)
                            const parsed = iface.parseLog({ topics: log.topics as string[], data: log.data })
                            return parsed?.name === 'ProposalCreated'
                        } catch {
                            return false
                        }
                    })

                    if (event) {
                        const { ethers } = require('ethers')
                        const CHAMA_GOVERNOR_ABI = require('@/lib/contract-abis').CHAMA_GOVERNOR_ABI
                        const iface = new ethers.Interface(CHAMA_GOVERNOR_ABI)
                        const parsedEvent = iface.parseLog({ topics: event.topics as string[], data: event.data })
                        const proposalId = parsedEvent?.args[0]?.toString()

                        // Calculate totals at the time of saving
                        const activeContributions = contributions.filter(c => c.included)
                        const total = activeContributions.reduce((sum, c) => sum + c.amount, 0)

                        // Create clean description without markdown (table is shown separately below)
                        const description = `Contribution reconciliation for ${activeContributions.length} members totaling KES ${total.toLocaleString()}. Average contribution: KES ${(total / activeContributions.length).toFixed(2)}.

All contribution records are stored immutably on IPFS and displayed in the table below.

Vote FOR to verify these contributions and update the treasury.
Vote AGAINST if you notice any discrepancies.`

                        // Save to database
                        const { data: proposal, error } = await supabase
                            .from('proposals')
                            .insert({
                                on_chain_proposal_id: proposalId,
                                chama_id: chamaId,
                                creator_id: user?.user_id || "",
                                title: `Contribution Reconciliation - ${format(new Date(), "MMMM yyyy")}`,
                                description: description,
                                proposal_type: "CONTRIBUTION_RECONCILIATION",
                                status: "Active",
                                ipfs_hash: publishedIpfsHash,
                                blockchain_tx_hash: receipt.transactionHash,
                                voting_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
                            })
                            .select()
                            .single()

                        if (error) {
                            console.error("Supabase error:", error)
                        } else {
                            console.log("Reconciliation proposal saved successfully!")
                            // Redirect to proposal page
                            router.push(`/proposal/${proposal.proposal_id}`)
                        }
                    }
                } catch (err) {
                    console.error("Error syncing to Supabase:", err)
                    setIsSubmitting(false)
                }
            }
            syncToSupabase()
        }
    }, [isSuccess, receipt, publishedIpfsHash, chamaId, user, contributions, router])

    const updateContribution = (userId: string, field: keyof ContributionEntry, value: any) => {
        setContributions(prev =>
            prev.map(c =>
                c.user_id === userId ? { ...c, [field]: value } : c
            )
        )
    }

    const toggleInclude = (userId: string) => {
        setContributions(prev =>
            prev.map(c =>
                c.user_id === userId ? { ...c, included: !c.included } : c
            )
        )
    }

    const selectAll = () => {
        setContributions(prev => prev.map(c => ({ ...c, included: true })))
    }

    const deselectAll = () => {
        setContributions(prev => prev.map(c => ({ ...c, included: false })))
    }

    const resetAmounts = () => {
        setContributions(prev =>
            prev.map(c => ({
                ...c,
                amount: expectedAmount,
                reference: "",
                notes: "Monthly contribution"
            }))
        )
    }

    const includedContributions = contributions.filter(c => c.included)
    const totalAmount = includedContributions.reduce((sum, c) => sum + c.amount, 0)
    const averageAmount = includedContributions.length > 0
        ? totalAmount / includedContributions.length
        : 0

    const handleSubmit = async () => {
        if (includedContributions.length === 0) {
            toast.error("Please select at least one member")
            return
        }

        if (!user?.user_id) {
            toast.error("User not authenticated")
            return
        }

        if (!governorAddress) {
            toast.error("Governor contract not found", { description: "Please ensure the Chama is deployed on-chain" })
            return
        }

        setIsSubmitting(true)
        try {
            // Import the IPFS upload function
            const { uploadProposalToIPFS } = await import("@/app/actions/ipfs")

            // Prepare reconciliation data for IPFS
            const reconciliationData = {
                chamaId,
                entries: includedContributions.map(c => ({
                    memberId: c.user_id,
                    memberName: c.memberName, // Include member name for table display
                    amount: c.amount,
                    reference: c.reference,
                    date: format(c.date, "yyyy-MM-dd"),
                    paymentMethod: c.reference.startsWith("MPESA") || c.reference.startsWith("Mpesa") ? "M-Pesa" : "Other",
                    notes: c.notes
                })),
                totalAmount,
                createdBy: user.user_id,
                createdAt: new Date().toISOString()
            }

            // Upload to IPFS using server action
            const ipfsHash = await uploadProposalToIPFS(reconciliationData)
            setPublishedIpfsHash(ipfsHash)

            // Submit proposal to blockchain
            // Use IPFS hash in description so Governor contract can reference the data
            const description = `ipfs://${ipfsHash}`
            await propose([governorAddress as `0x${string}`], [BigInt(0)], ["0x"], description)

        } catch (error) {
            console.error("Error submitting reconciliation:", error)
            toast.error("Failed to submit reconciliation", { description: error instanceof Error ? error.message : "Unknown error" })
            setIsSubmitting(false)
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--kente-orange)]" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div>
                    <Button
                        variant="ghost"
                        onClick={() => router.back()}
                        className="mb-4"
                    >
                        ← Back
                    </Button>
                    <h1 className="text-3xl font-bold">Record Contributions</h1>
                    <p className="text-muted-foreground">{chamaName}</p>
                </div>

                {/* Info Card */}
                <Card className="border-blue-200 bg-blue-50">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                            <div>
                                <p className="text-sm text-blue-900">
                                    <strong>How it works:</strong> All members are pre-selected with expected contribution ({expectedAmount.toLocaleString()} KES).
                                    Uncheck members who didn't contribute, edit amounts for partial/extra payments, then submit as a proposal for voting.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardDescription>Contributing Members</CardDescription>
                            <CardTitle className="text-3xl">{includedContributions.length}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-3">
                            <CardDescription>Total Amount</CardDescription>
                            <CardTitle className="text-3xl">KES {totalAmount.toLocaleString()}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-3">
                            <CardDescription>Average Contribution</CardDescription>
                            <CardTitle className="text-3xl">KES {Math.round(averageAmount).toLocaleString()}</CardTitle>
                        </CardHeader>
                    </Card>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={selectAll}>
                        Select All
                    </Button>
                    <Button variant="outline" size="sm" onClick={deselectAll}>
                        Deselect All
                    </Button>
                    <Button variant="outline" size="sm" onClick={resetAmounts}>
                        Reset Amounts
                    </Button>
                </div>

                {/* Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Contributions List</CardTitle>
                        <CardDescription>
                            Mark who contributed and enter payment details
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-lg overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-muted">
                                    <tr>
                                        <th className="p-3 text-left font-medium">✓</th>
                                        <th className="p-3 text-left font-medium">Member</th>
                                        <th className="p-3 text-left font-medium">Amount (KES)</th>
                                        <th className="p-3 text-left font-medium">Reference</th>
                                        <th className="p-3 text-left font-medium">Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {contributions.map((contribution) => (
                                        <tr
                                            key={contribution.user_id}
                                            className={cn(
                                                "border-t",
                                                !contribution.included && "opacity-50 bg-gray-50"
                                            )}
                                        >
                                            <td className="p-3">
                                                <Checkbox
                                                    checked={contribution.included}
                                                    onCheckedChange={() => toggleInclude(contribution.user_id)}
                                                />
                                            </td>
                                            <td className="p-3 font-medium">
                                                {contribution.memberName}
                                            </td>
                                            <td className="p-3">
                                                <Input
                                                    type="number"
                                                    value={contribution.amount}
                                                    onChange={(e) =>
                                                        updateContribution(
                                                            contribution.user_id,
                                                            "amount",
                                                            Number(e.target.value)
                                                        )
                                                    }
                                                    className="w-32"
                                                    disabled={!contribution.included}
                                                />
                                            </td>
                                            <td className="p-3">
                                                <Input
                                                    value={contribution.reference}
                                                    onChange={(e) =>
                                                        updateContribution(
                                                            contribution.user_id,
                                                            "reference",
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="MPESA123"
                                                    className="w-40"
                                                    disabled={!contribution.included}
                                                />
                                            </td>
                                            <td className="p-3">
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            className={cn(
                                                                "w-36 justify-start text-left font-normal",
                                                                !contribution.date && "text-muted-foreground"
                                                            )}
                                                            disabled={!contribution.included}
                                                        >
                                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                                            {contribution.date ? format(contribution.date, "PPP") : "Pick date"}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0">
                                                        <Calendar
                                                            mode="single"
                                                            selected={contribution.date}
                                                            onSelect={(date) =>
                                                                updateContribution(
                                                                    contribution.user_id,
                                                                    "date",
                                                                    date || new Date()
                                                                )
                                                            }
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Submit Button */}
                <div className="flex justify-end gap-4">
                    <Button
                        variant="outline"
                        onClick={() => router.back()}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || isPending || isConfirming || includedContributions.length === 0}
                        className="bg-[var(--kente-orange)] hover:bg-[var(--kente-orange)]/90"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Uploading to IPFS...
                            </>
                        ) : isPending ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Confirm in Wallet...
                            </>
                        ) : isConfirming ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Submitting on Blockchain...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Submit Reconciliation
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    )
}

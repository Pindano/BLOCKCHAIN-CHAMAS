"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Loader2, CheckCircle2, Calculator } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useUser } from "@/lib/UserContext"
import { useChamaGovernor } from "@/hooks/useChamaGovernor"
import { format } from "date-fns"

export default function LoanRequestPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const chamaId = searchParams.get("chamaId")
    const { user, address } = useUser()

    const [chamaName, setChamaName] = useState("")
    const [governorAddress, setGovernorAddress] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [publishedIpfsHash, setPublishedIpfsHash] = useState<string | null>(null)

    // Form fields
    const [principalAmount, setPrincipalAmount] = useState("")
    const [termMonths, setTermMonths] = useState("12")
    const [interestRate, setInterestRate] = useState("5")
    const [purpose, setPurpose] = useState("")
    const [collateral, setCollateral] = useState("")

    // Blockchain submission
    const { propose, isPending, isConfirming, isSuccess, receipt } = useChamaGovernor(governorAddress as `0x${string} `)

    // Fetch chama details
    useEffect(() => {
        if (!chamaId) {
            router.push("/dashboard")
            return
        }

        const fetchChama = async () => {
            const { data } = await supabase
                .from("chamas")
                .select("name, governor_address")
                .eq("chama_id", chamaId)
                .single()

            if (data) {
                setChamaName(data.name)
                setGovernorAddress(data.governor_address)
            }
        }

        fetchChama()
    }, [chamaId, router])

    // Calculate monthly payment
    const calculateMonthlyPayment = () => {
        const principal = parseFloat(principalAmount) || 0
        const rate = parseFloat(interestRate) || 0
        const months = parseInt(termMonths) || 1

        if (principal === 0 || months === 0) return 0

        // Simple interest calculation
        const totalInterest = (principal * rate * months) / (12 * 100)
        const totalAmount = principal + totalInterest
        return totalAmount / months
    }

    const monthlyPayment = calculateMonthlyPayment()

    // Handle successful blockchain transaction
    useEffect(() => {
        if (isSuccess && receipt && publishedIpfsHash) {
            const syncToDatabase = async () => {
                try {
                    const { ethers } = require('ethers')
                    const CHAMA_GOVERNOR_ABI = require('@/lib/contract-abis').CHAMA_GOVERNOR_ABI

                    // Extract ProposalCreated event
                    const event = receipt.logs.find(log => {
                        try {
                            const iface = new ethers.Interface(CHAMA_GOVERNOR_ABI)
                            const parsed = iface.parseLog({ topics: log.topics as string[], data: log.data })
                            return parsed?.name === 'ProposalCreated'
                        } catch {
                            return false
                        }
                    })

                    if (event) {
                        const iface = new ethers.Interface(CHAMA_GOVERNOR_ABI)
                        const parsedEvent = iface.parseLog({ topics: event.topics as string[], data: event.data })
                        const proposalId = parsedEvent?.args[0]?.toString()

                        // Save to database
                        const { data: proposal, error } = await supabase
                            .from('proposals')
                            .insert({
                                on_chain_proposal_id: proposalId,
                                chama_id: chamaId,
                                creator_id: user?.user_id || "",
                                title: `Loan Request - KES ${parseFloat(principalAmount).toLocaleString()} `,
                                description: `${user?.first_name || 'Member'} ${user?.last_name || ''} is requesting a loan.

    Amount: KES ${parseFloat(principalAmount).toLocaleString()}
Term: ${termMonths} months
Interest Rate: ${interestRate}% per annum
Monthly Payment: KES ${monthlyPayment.toFixed(2)}

Purpose: ${purpose}
Collateral: ${collateral || 'None specified'} `,
                                proposal_type: "LOAN_REQUEST",
                                status: "Active",
                                ipfs_hash: publishedIpfsHash,
                                blockchain_tx_hash: receipt.transactionHash,
                                voting_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
                            })
                            .select()
                            .single()

                        if (!error) {
                            router.push(`/ proposal / ${proposal.proposal_id} `)
                        }
                    }
                } catch (err) {
                    console.error("Error syncing to database:", err)
                    setIsSubmitting(false)
                }
            }
            syncToDatabase()
        }
    }, [isSuccess, receipt, publishedIpfsHash, chamaId, user, principalAmount, termMonths, interestRate, purpose, collateral, monthlyPayment, router])

    const handleSubmit = async () => {
        if (!user?.user_id || !governorAddress) {
            toast.error("User not authenticated or Chama not deployed")
            return
        }

        if (!principalAmount || !purpose) {
            toast.error("Please fill in all required fields")
            return
        }

        setIsSubmitting(true)
        try {
            // Import IPFS upload function
            const { uploadProposalToIPFS } = await import("@/app/actions/ipfs")

            // Prepare loan request data for IPFS
            const loanRequestData = {
                chamaId,
                borrowerId: user.user_id,
                borrowerName: `${user.first_name} ${user.last_name} `,
                borrowerEmail: user.email,
                principalAmount: parseFloat(principalAmount),
                interestRate: parseFloat(interestRate),
                termMonths: parseInt(termMonths),
                monthlyPayment: monthlyPayment,
                purpose,
                collateralDescription: collateral,
                requestedDate: new Date().toISOString(),
                createdBy: user.user_id
            }

            // Upload to IPFS
            const ipfsHash = await uploadProposalToIPFS(loanRequestData)
            setPublishedIpfsHash(ipfsHash)

            // Submit proposal to blockchain (metadata already in IPFS and will be in DB)
            const description = `ipfs://${ipfsHash}`
            await propose(
                [governorAddress as `0x${string}`],
                [BigInt(0)],
                ["0x"],
                description
            )

        } catch (error) {
            console.error("Error submitting loan request:", error)
            toast.error("Failed to submit loan request", { description: error instanceof Error ? error.message : "Unknown error" })
            setIsSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Header */}
                <div>
                    <Button variant="ghost" onClick={() => router.back()} className="gap-2 mb-4">
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </Button>
                    <h1 className="text-3xl font-bold">Request Loan</h1>
                    <p className="text-muted-foreground">{chamaName}</p>
                </div>

                {/* Loan Request Form */}
                <Card>
                    <CardHeader>
                        <CardTitle>Loan Details</CardTitle>
                        <CardDescription>Enter the loan amount and terms for member approval</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Principal Amount */}
                        <div>
                            <Label htmlFor="amount">Loan Amount (KES) *</Label>
                            <Input
                                id="amount"
                                type="number"
                                placeholder="50000"
                                value={principalAmount}
                                onChange={(e) => setPrincipalAmount(e.target.value)}
                                min="0"
                            />
                        </div>

                        {/* Term and Interest Rate */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="term">Term (Months) *</Label>
                                <Input
                                    id="term"
                                    type="number"
                                    value={termMonths}
                                    onChange={(e) => setTermMonths(e.target.value)}
                                    min="1"
                                    max="60"
                                />
                            </div>
                            <div>
                                <Label htmlFor="interest">Interest Rate (% per annum)</Label>
                                <Input
                                    id="interest"
                                    type="number"
                                    step="0.1"
                                    value={interestRate}
                                    onChange={(e) => setInterestRate(e.target.value)}
                                    min="0"
                                    max="100"
                                />
                            </div>
                        </div>

                        {/* Monthly Payment Calculator */}
                        <div className="p-4 bg-muted/30 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <Calculator className="w-4 h-4 text-[var(--kente-orange)]" />
                                <span className="text-sm font-medium">Calculated Monthly Payment</span>
                            </div>
                            <p className="text-2xl font-bold text-[var(--kente-orange)]">
                                KES {monthlyPayment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Total repayment: KES {(monthlyPayment * parseInt(termMonths || "1")).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </p>
                        </div>

                        {/* Purpose */}
                        <div>
                            <Label htmlFor="purpose">Purpose *</Label>
                            <Textarea
                                id="purpose"
                                placeholder="Explain why you need this loan and how it will be used..."
                                value={purpose}
                                onChange={(e) => setPurpose(e.target.value)}
                                rows={4}
                            />
                        </div>

                        {/* Collateral */}
                        <div>
                            <Label htmlFor="collateral">Collateral (Optional)</Label>
                            <Textarea
                                id="collateral"
                                placeholder="Describe any collateral you're offering..."
                                value={collateral}
                                onChange={(e) => setCollateral(e.target.value)}
                                rows={3}
                            />
                        </div>

                        {/* Submit Button */}
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting || isPending || isConfirming || !principalAmount || !purpose}
                            className="w-full bg-[var(--kente-orange)] hover:bg-[var(--kente-orange)]/90"
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
                                    Submit Loan Request
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

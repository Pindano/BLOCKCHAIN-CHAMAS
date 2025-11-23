"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { decodeEventLog } from 'viem'
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Loader2, CheckCircle2, DollarSign } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useUser } from "@/lib/UserContext"
import { useChamaGovernor } from "@/hooks/useChamaGovernor"
import { format } from "date-fns"

export default function LoanRepaymentPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const chamaId = searchParams.get("chamaId")
    const { user } = useUser()

    const [chamaName, setChamaName] = useState("")
    const [governorAddress, setGovernorAddress] = useState<string | null>(null)
    const [activeLoans, setActiveLoans] = useState<any[]>([])
    const [selectedLoan, setSelectedLoan] = useState<any | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [publishedIpfsHash, setPublishedIpfsHash] = useState<string | null>(null)

    // Form fields
    const [repaymentAmount, setRepaymentAmount] = useState("")
    const [paymentMethod, setPaymentMethod] = useState("M-Pesa")
    const [reference, setReference] = useState("")

    // Blockchain submission
    const { propose, isPending, isConfirming, isSuccess, receipt } = useChamaGovernor(governorAddress as `0x${string}`)

    // Fetch chama and active loans
    useEffect(() => {
        if (!chamaId) {
            router.push("/dashboard")
            return
        }

        const fetchData = async () => {
            // Fetch chama
            const { data: chamaData } = await supabase
                .from("chamas")
                .select("name, governor_address")
                .eq("chama_id", chamaId)
                .single()

            if (chamaData) {
                setChamaName(chamaData.name)
                setGovernorAddress(chamaData.governor_address)
            }

            // Fetch active loans
            const { data: loansData, error: loansError } = await supabase
                .from("loans")
                .select("*")
                .eq("chama_id", chamaId)
                .eq("status", "active")
                .order("created_at", { ascending: false })

            if (loansError) {
                console.error("Error fetching loans:", loansError)
                return
            }

            if (loansData && loansData.length > 0) {
                // Fetch user details manually
                const borrowerIds = Array.from(new Set(loansData.map(l => l.borrower_id)))
                const { data: usersData } = await supabase
                    .from("users")
                    .select("user_id, first_name, last_name")
                    .in("user_id", borrowerIds)

                const userMap = (usersData || []).reduce((acc: any, user: any) => {
                    acc[user.user_id] = user
                    return acc
                }, {})

                const loansWithUsers = loansData.map(loan => ({
                    ...loan,
                    users: userMap[loan.borrower_id] || { first_name: 'Unknown', last_name: 'User' }
                }))

                setActiveLoans(loansWithUsers)
            } else {
                setActiveLoans([])
            }
        }

        fetchData()
    }, [chamaId, router])

    // Calculate new balance
    const calculateNewBalance = () => {
        if (!selectedLoan || !repaymentAmount) return selectedLoan?.outstanding_balance || 0
        return Math.max(0, (selectedLoan.outstanding_balance || 0) - parseFloat(repaymentAmount))
    }

    const newBalance = calculateNewBalance()

    // Handle successful blockchain transaction
    useEffect(() => {
        if (isSuccess && receipt && publishedIpfsHash && selectedLoan) {
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

                        const borrowerName = `${selectedLoan.users?.first_name || ''} ${selectedLoan.users?.last_name || ''}`

                        // Save to database
                        const { data: proposal, error } = await supabase
                            .from('proposals')
                            .insert({
                                on_chain_proposal_id: proposalId,
                                chama_id: chamaId,
                                creator_id: user?.user_id || "",
                                title: `Loan Repayment - ${borrowerName}`,
                                description: `Loan repayment verification for ${borrowerName}.

Repayment Amount: KES ${parseFloat(repaymentAmount).toLocaleString()}
Payment Method: ${paymentMethod}
Reference: ${reference || 'N/A'}

Previous Balance: KES ${selectedLoan.outstanding_balance.toLocaleString()}
New Balance: KES ${newBalance.toLocaleString()}

${newBalance === 0 ? '✅ This repayment will fully settle the loan.' : `Remaining: KES ${newBalance.toLocaleString()}`}`,
                                proposal_type: "LOAN_REPAYMENT",
                                status: "Active",
                                ipfs_hash: publishedIpfsHash,
                                blockchain_tx_hash: receipt.transactionHash,
                                voting_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
                            })
                            .select()
                            .single()

                        if (!error) {
                            router.push(`/proposal/${proposal.proposal_id}`)
                        }
                    }
                } catch (err) {
                    console.error("Error syncing to database:", err)
                    setIsSubmitting(false)
                }
            }
            syncToDatabase()
        }
    }, [isSuccess, receipt, publishedIpfsHash, selectedLoan, chamaId, user, repaymentAmount, paymentMethod, reference, newBalance, router])

    const handleSubmit = async () => {
        if (!user?.user_id || !governorAddress || !selectedLoan) {
            toast.error("User not authenticated or loan not selected")
            return
        }

        if (!repaymentAmount || parseFloat(repaymentAmount) <= 0) {
            toast.error("Please enter a valid repayment amount")
            return
        }

        if (parseFloat(repaymentAmount) > selectedLoan.outstanding_balance) {
            toast.error("Repayment amount cannot exceed outstanding balance")
            return
        }

        setIsSubmitting(true)
        try {
            // Import IPFS upload function
            const { uploadProposalToIPFS } = await import("@/app/actions/ipfs")

            const borrowerName = `${selectedLoan.users?.first_name || ''} ${selectedLoan.users?.last_name || ''}`

            // Prepare repayment data for IPFS
            const repaymentData = {
                loanId: selectedLoan.loan_id,
                borrowerId: selectedLoan.borrower_id,
                borrowerName: borrowerName,
                repaymentAmount: parseFloat(repaymentAmount),
                paymentDate: new Date().toISOString(),
                paymentMethod,
                reference,
                previousBalance: selectedLoan.outstanding_balance,
                newBalance: newBalance,
                recordedBy: user.user_id,
                createdAt: new Date().toISOString()
            }

            // Upload to IPFS
            const ipfsHash = await uploadProposalToIPFS(repaymentData)
            setPublishedIpfsHash(ipfsHash)

            // Submit proposal to blockchain
            const description = `ipfs://${ipfsHash}`
            await propose([governorAddress as `0x${string}`], [BigInt(0)], ["0x"], description)

        } catch (error) {
            console.error("Error submitting repayment:", error)
            toast.error("Failed to submit repayment", { description: error instanceof Error ? error.message : "Unknown error" })
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
                    <h1 className="text-3xl font-bold">Record Loan Repayment</h1>
                    <p className="text-muted-foreground">{chamaName}</p>
                </div>

                {/* Active Loans */}
                {activeLoans.length === 0 ? (
                    <Card>
                        <CardContent className="pt-6 text-center text-muted-foreground">
                            No active loans found in this Chama.
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        {/* Loan Selection */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Select Loan</CardTitle>
                                <CardDescription>Choose the loan to record a repayment for</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Select onValueChange={(value) => {
                                    const loan = activeLoans.find(l => l.loan_id === value)
                                    setSelectedLoan(loan || null)
                                    setRepaymentAmount("")
                                }}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a loan..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {activeLoans.map(loan => (
                                            <SelectItem key={loan.loan_id} value={loan.loan_id}>
                                                {loan.users?.first_name} {loan.users?.last_name} - KES {loan.outstanding_balance?.toLocaleString()}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </CardContent>
                        </Card>

                        {/* Repayment Form */}
                        {selectedLoan && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Repayment Details</CardTitle>
                                    <CardDescription>Enter the repayment information</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Loan Info */}
                                    <div className="p-4 bg-muted/30 rounded-lg space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">Borrower:</span>
                                            <span className="text-sm font-medium">{selectedLoan.users?.first_name} {selectedLoan.users?.last_name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">Original Amount:</span>
                                            <span className="text-sm font-medium">KES {selectedLoan.principal_amount?.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm font-medium">Current Balance:</span>
                                            <span className="text-lg font-bold text-[var(--kente-orange)]">
                                                KES {selectedLoan.outstanding_balance?.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Repayment Amount */}
                                    <div>
                                        <Label htmlFor="amount">Repayment Amount (KES) *</Label>
                                        <Input
                                            id="amount"
                                            type="number"
                                            placeholder="5000"
                                            value={repaymentAmount}
                                            onChange={(e) => setRepaymentAmount(e.target.value)}
                                            max={selectedLoan.outstanding_balance}
                                            min="0"
                                        />
                                    </div>

                                    {/* Payment Method */}
                                    <div>
                                        <Label htmlFor="method">Payment Method *</Label>
                                        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                            <SelectTrigger id="method">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="M-Pesa">M-Pesa</SelectItem>
                                                <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                                                <SelectItem value="Cash">Cash</SelectItem>
                                                <SelectItem value="Other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Reference */}
                                    <div>
                                        <Label htmlFor="reference">Payment Reference</Label>
                                        <Input
                                            id="reference"
                                            placeholder="Transaction ID or reference number"
                                            value={reference}
                                            onChange={(e) => setReference(e.target.value)}
                                        />
                                    </div>

                                    {/* New Balance Preview */}
                                    {repaymentAmount && (
                                        <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                                            <div className="flex items-center gap-2 mb-2">
                                                <DollarSign className="w-4 h-4 text-green-600" />
                                                <span className="text-sm font-medium text-green-900 dark:text-green-100">New Balance After Payment</span>
                                            </div>
                                            <p className="text-2xl font-bold text-green-600">
                                                KES {newBalance.toLocaleString()}
                                            </p>
                                            {newBalance === 0 && (
                                                <p className="text-sm text-green-600 mt-1">✅ Loan will be fully repaid</p>
                                            )}
                                        </div>
                                    )}

                                    {/* Submit Button */}
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={isSubmitting || isPending || isConfirming || !repaymentAmount}
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
                                                Submit Repayment for Approval
                                            </>
                                        )}
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

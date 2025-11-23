// components/dashboard/proposals/ProposalDetailView.tsx
"use client"

import { useEffect, useState } from "react"
import { getSupabaseClient } from "@/lib/supabase-client"
import { useParams, useRouter } from "next/navigation"
import { useUser } from "@/lib/UserContext"
import type { Proposal } from "@/lib/types"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Calendar, User, FileText, ExternalLink, Download } from "lucide-react"
import { format } from "date-fns"
import { ConstitutionDiffViewer } from "./ConstitutionDiffViewer"
import { CommentsSection } from "./CommentsSection"
import { QuickVoteButtons } from "./QuickVoteButtons"

interface ProposalDetail extends Proposal {
    chamaName?: string
    creatorName?: string
    isVotingActive?: boolean
    votesFor?: number
    votesAgainst?: number
    votesAbstain?: number
    totalVotes?: number
    reconciliationData?: any[]
    governorAddress?: string
    tokenAddress?: string
    onChainProposalId?: string
    constitutionText?: string
}

export function ProposalDetailView() {
    const params = useParams()
    const router = useRouter()
    const proposalId = params.id as string
    const { user, isLoading: isUserLoading } = useUser()

    const [proposal, setProposal] = useState<ProposalDetail | null>(null)
    const [loading, setLoading] = useState(true)

    const supabase = getSupabaseClient()

    useEffect(() => {
        if (isUserLoading || !user) return
        fetchProposalDetails()
    }, [user, isUserLoading, proposalId])

    const fetchProposalDetails = async () => {
        setLoading(true)

        // Fetch proposal with related data
        const { data: proposalData, error } = await supabase
            .from("proposals")
            .select(`
        *,
        chamas(name),
        users(first_name, last_name)
      `)
            .eq("proposal_id", proposalId)
            .single()

        if (error || !proposalData) {
            toast.error("Failed to load proposal", { description: error?.message })
            setLoading(false)
            return
        }

        // Fetch votes
        const { data: votesData } = await supabase
            .from("votes")
            .select("vote_choice, voting_power")
            .eq("proposal_id", proposalId)

        const votesFor = votesData?.filter(v => v.vote_choice === "for").reduce((sum, v) => sum + (v.voting_power || 1), 0) || 0
        const votesAgainst = votesData?.filter(v => v.vote_choice === "against").reduce((sum, v) => sum + (v.voting_power || 1), 0) || 0
        const votesAbstain = votesData?.filter(v => v.vote_choice === "abstain").reduce((sum, v) => sum + (v.voting_power || 1), 0) || 0
        const totalVotes = votesFor + votesAgainst + votesAbstain

        const now = new Date()
        const votingStart = proposalData.voting_start ? new Date(proposalData.voting_start) : null
        const votingEnd = proposalData.voting_end ? new Date(proposalData.voting_end) : null

        // Voting is active if current time is between voting_start and voting_end
        const isVotingActive = votingStart && votingEnd
            ? (now >= votingStart && now < votingEnd)
            : false

        // If it's a CONTRIBUTION_RECONCILIATION proposal, fetch IPFS data
        let reconciliationData = null
        if (proposalData.proposal_type === "CONTRIBUTION_RECONCILIATION" && proposalData.ipfs_hash) {
            try {
                const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${proposalData.ipfs_hash}`
                const response = await fetch(ipfsUrl)
                const data = await response.json()
                reconciliationData = Array.isArray(data) ? data : data.entries || []
            } catch (err) {
                console.error("Failed to fetch IPFS data:", err)
            }
        }

        // Fetch Chama details for on-chain info and constitution
        const { data: chamaData } = await supabase
            .from("chamas")
            .select("governor_address, token_address, constitution_text")
            .eq("chama_id", proposalData.chama_id)
            .single()

        setProposal({
            ...proposalData,
            chamaName: (proposalData as any).chamas?.name,
            creatorName: `${(proposalData as any).users?.first_name} ${(proposalData as any).users?.last_name}`,
            isVotingActive,
            votesFor,
            votesAgainst,
            votesAbstain,
            totalVotes,
            reconciliationData,
            governorAddress: chamaData?.governor_address,
            tokenAddress: chamaData?.token_address,
            onChainProposalId: proposalData.on_chain_proposal_id,
            constitutionText: chamaData?.constitution_text
        })
        setLoading(false)
    }

    if (loading || isUserLoading) {
        return <div className="text-center py-12 text-muted-foreground">Loading proposal...</div>
    }

    if (!proposal) {
        return <div className="text-center py-12 text-destructive">Proposal not found.</div>
    }

    const forPercentage = proposal.totalVotes ? (proposal.votesFor! / proposal.totalVotes) * 100 : 0
    const againstPercentage = proposal.totalVotes ? (proposal.votesAgainst! / proposal.totalVotes) * 100 : 0
    const abstainPercentage = proposal.totalVotes ? (proposal.votesAbstain! / proposal.totalVotes) * 100 : 0

    return (
        <div className="space-y-6">
            {/* Back Button */}
            <Button variant="ghost" onClick={() => router.back()} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
            </Button>

            {/* Header */}
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <Badge variant={proposal.isVotingActive ? "default" : "secondary"}>
                        {proposal.isVotingActive ? "Active" : "Ended"}
                    </Badge>
                    <Badge variant="outline">{proposal.proposal_type}</Badge>
                </div>
                <h1 className="text-3xl font-bold">{proposal.title}</h1>
                <p className="text-muted-foreground mt-1">{proposal.chamaName}</p>
            </div>

            {/* Proposal Info Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Proposal Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="flex items-start gap-3">
                            <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="text-sm font-medium">Proposed by</p>
                                <p className="text-sm text-muted-foreground">{proposal.creatorName}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="text-sm font-medium">Voting Period</p>
                                <p className="text-sm text-muted-foreground">
                                    {proposal.voting_start && format(new Date(proposal.voting_start), "MMM d, yyyy")} - {proposal.voting_end && format(new Date(proposal.voting_end), "MMM d, yyyy")}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <p className="text-sm font-medium mb-2">Description</p>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{proposal.description}</p>
                    </div>

                    {proposal.ipfs_hash && (
                        <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                            <Button variant="link" asChild className="h-auto p-0">
                                <a href={`https://gateway.pinata.cloud/ipfs/${proposal.ipfs_hash}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                                    View on IPFS
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Quick Vote Buttons */}
            {proposal.isVotingActive && proposal.governorAddress && proposal.onChainProposalId && (
                <Card>
                    <CardHeader>
                        <CardTitle>Cast Your Vote</CardTitle>
                        <CardDescription>Vote on this proposal</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <QuickVoteButtons
                            proposalId={proposal.proposal_id}
                            governorAddress={proposal.governorAddress}
                            onChainProposalId={proposal.onChainProposalId || ""}
                            isVotingActive={proposal.isVotingActive}
                            hasVoted={false} // Placeholder for actual hasVoted logic
                        />
                    </CardContent>
                </Card>
            )}
            {/* Show warning if proposal doesn't have on-chain ID */}
            {!proposal.onChainProposalId && (
                <Card className="border-yellow-200 bg-yellow-50">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                            <div className="text-yellow-600">⚠️</div>
                            <div>
                                <p className="font-medium text-yellow-900">Proposal Not Yet On-Chain</p>
                                <p className="text-sm text-yellow-700 mt-1">
                                    This proposal is still being confirmed on the blockchain. Voting will be enabled once the transaction is confirmed.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}


            {/* Voting Results Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Voting Results</CardTitle>
                    <CardDescription>{proposal.totalVotes} total votes cast</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="font-medium">For</span>
                            <span className="text-muted-foreground">{proposal.votesFor} ({forPercentage.toFixed(1)}%)</span>
                        </div>
                        <Progress value={forPercentage} className="h-2" />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="font-medium">Against</span>
                            <span className="text-muted-foreground">{proposal.votesAgainst} ({againstPercentage.toFixed(1)}%)</span>
                        </div>
                        <Progress value={againstPercentage} className="h-2" />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="font-medium">Abstain</span>
                            <span className="text-muted-foreground">{proposal.votesAbstain} ({abstainPercentage.toFixed(1)}%)</span>
                        </div>
                        <Progress value={abstainPercentage} className="h-2" />
                    </div>
                </CardContent>
            </Card>

            {/* Reconciliation Data Table (for CONTRIBUTION_RECONCILIATION proposals) */}
            {proposal.proposal_type === "CONTRIBUTION_RECONCILIATION" && proposal.reconciliationData && (
                <Card>
                    <CardHeader>
                        <CardTitle>Contribution Records</CardTitle>
                        <CardDescription>Off-chain contributions submitted for approval</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/50">
                                        <th className="p-3 text-left font-medium">Member</th>
                                        <th className="p-3 text-left font-medium">Amount</th>
                                        <th className="p-3 text-left font-medium">Date</th>
                                        <th className="p-3 text-left font-medium">Reference</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {proposal.reconciliationData.map((entry: any, index: number) => (
                                        <tr key={index} className="border-b last:border-0">
                                            <td className="p-3">{entry.member || entry.memberName || "N/A"}</td>
                                            <td className="p-3">KES {entry.amount?.toLocaleString() || 0}</td>
                                            <td className="p-3">{entry.date || "N/A"}</td>
                                            <td className="p-3">{entry.reference || "N/A"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-4 flex justify-end">
                            <Button variant="outline" className="gap-2" onClick={() => {
                                const dataStr = JSON.stringify(proposal.reconciliationData, null, 2)
                                const dataBlob = new Blob([dataStr], { type: 'application/json' })
                                const url = URL.createObjectURL(dataBlob)
                                const link = document.createElement('a')
                                link.href = url
                                link.download = `contributions-${proposalId}.json`
                                link.click()
                            }}>
                                <Download className="w-4 h-4" />
                                Download Data
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Constitution Diff Viewer (for CONSTITUTION_EDIT proposals) */}
            {proposal.proposal_type === "CONSTITUTION_EDIT" && proposal.ipfs_hash && chama.constitution_ipfs_cid && (
                <ConstitutionDiffViewer
                    oldIpfsHash={proposal.chama.constitution_ipfs_cid}
                    newIpfsHash={proposal.ipfs_hash}
                />
            )}

            {/* On-Chain Details */}
            {(proposal.governorAddress || proposal.tokenAddress || proposal.onChainProposalId) && (
                <Card>
                    <CardHeader>
                        <CardTitle>On-Chain Details</CardTitle>
                        <CardDescription>Blockchain verification information</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {proposal.governorAddress && (
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Governor Contract:</span>
                                <code className="text-xs bg-muted px-2 py-1 rounded">{proposal.governorAddress}</code>
                            </div>
                        )}
                        {proposal.tokenAddress && (
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Token Contract:</span>
                                <code className="text-xs bg-muted px-2 py-1 rounded">{proposal.tokenAddress}</code>
                            </div>
                        )}
                        {proposal.onChainProposalId && (
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Proposal ID:</span>
                                <code className="text-xs bg-muted px-2 py-1 rounded">{proposal.onChainProposalId}</code>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Constitution Display (for CONSTITUTION_EDIT) */}
            {proposal.proposal_type === "CONSTITUTION_EDIT" && proposal.constitutionText && (
                <Card>
                    <CardHeader>
                        <CardTitle>Current Constitution</CardTitle>
                        <CardDescription>Chama constitution from database</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="prose prose-sm max-w-none">
                            <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg">
                                {proposal.constitutionText}
                            </pre>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Discussion/Comments */}
            <CommentsSection proposalId={proposalId} />
        </div>
    )
}

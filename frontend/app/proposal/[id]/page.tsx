"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  ArrowLeft,
  Calendar,
  Users,
  CheckCircle2,
  XCircle,
  MinusCircle,
  ChevronRight,
  Loader2
} from "lucide-react"
import { decodeEventLog, keccak256, stringToBytes } from 'viem'
import { useChamaGovernor } from "@/hooks/useChamaGovernor"
import { supabase } from "@/lib/supabase"
import { CHAMA_GOVERNOR_ABI } from "@/lib/contract-abis"
import { useUser } from "@/lib/UserContext"
import { useReadContract } from 'wagmi'
import { toast } from "sonner"

export default function ProposalDetailPage() {
  const params = useParams()
  const router = useRouter()
  const proposalId = params?.id as string
  const { address, user } = useUser()

  const [proposal, setProposal] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [votes, setVotes] = useState<any[]>([])
  const [chama, setChama] = useState<any>(null)
  const [governorAddress, setGovernorAddress] = useState<string | null>(null)
  const [reconciliationData, setReconciliationData] = useState<any[]>([])
  const [loanData, setLoanData] = useState<any>(null)
  const [repaymentData, setRepaymentData] = useState<any>(null)

  const { castVote, execute, isPending, isConfirming, isSuccess, receipt } = useChamaGovernor(governorAddress as `0x${string}`)

  // Fetch proposal state from blockchain
  const { data: proposalState, refetch: refetchState } = useReadContract({
    address: governorAddress as `0x${string}`,
    abi: CHAMA_GOVERNOR_ABI,
    functionName: 'state',
    args: [BigInt(proposal?.on_chain_proposal_id || 0)],
    query: {
      enabled: !!governorAddress && !!proposal?.on_chain_proposal_id
    }
  })

  useEffect(() => {
    const fetchProposalData = async () => {
      if (!proposalId) return

      try {
        setIsLoading(true)
        // 1. Fetch Proposal
        const { data: proposalData, error: proposalError } = await supabase
          .from('proposals')
          .select('*')
          .eq('proposal_id', proposalId)
          .single()

        if (proposalError) throw proposalError

        // 2. Fetch Chama
        if (proposalData) {
          const { data: chamaData, error: chamaError } = await supabase
            .from('chamas')
            .select('*')
            .eq('chama_id', proposalData.chama_id)
            .single()

          if (chamaError) {
            console.error("Error fetching chama:", chamaError)
          } else {
            setChama(chamaData)
            // Set the governor address for voting
            if (chamaData?.governor_address) {
              setGovernorAddress(chamaData.governor_address)
            }
          }
        }

        // 3. Fetch Votes with user wallet addresses
        const { data: votesData, error: votesError } = await supabase
          .from('votes')
          .select(`
                        *,
                        users (
                            wallet_address,
                            email
                        )
                    `)
          .eq('proposal_id', proposalId)

        if (votesError) console.error("Error fetching votes:", votesError)
        setVotes(votesData || [])

        // Transform proposal data for UI
        const transformedProposal = {
          ...proposalData,
          code: `PROP-${proposalData.on_chain_proposal_id.toString().substring(0, 4)}`,
          chamaName: chama?.name || "Loading...", // Will update when chama loads
          chamaId: proposalData.chama_id,
          created: new Date(proposalData.created_at).toLocaleDateString(),
          endDate: "TBD", // Need to calculate based on creation + duration
          type: "Standard", // Placeholder
          votesFor: 0, // Calculate from votes
          votesAgainst: 0,
          votesAbstain: 0,
          totalVotes: votesData?.length || 0,
          requiredVotes: 0, // Need total members
          threshold: 60, // Placeholder or fetch from chama
          userVoted: null, // Determine from votes
          voters: (votesData || []).map(v => {
            const walletAddress = v.users?.wallet_address || ""
            return {
              name: walletAddress ? `${walletAddress.substring(0, 6)}...${walletAddress.substring(38)}` : (v.users?.email || "Unknown"),
              fullAddress: walletAddress,
              vote: v.vote_choice, // Use vote_choice from schema
              date: new Date(v.created_at).toLocaleDateString()
            }
          })
        }

        // Calculate vote stats from database votes
        let forCount = 0
        let againstCount = 0
        let abstainCount = 0
        let userVote = null

        votesData?.forEach(v => {
          // Use vote_choice from schema (lowercase: "for", "against", "abstain")
          if (v.vote_choice === "for") forCount++
          if (v.vote_choice === "against") againstCount++
          if (v.vote_choice === "abstain") abstainCount++
          // Check by user_id since votes table links to user, not wallet
          if (user && v.user_id === user.user_id) userVote = v.vote_choice
        })

        const total = votesData?.length || 0
        transformedProposal.votesFor = total > 0 ? Math.round((forCount / total) * 100) : 0
        transformedProposal.votesAgainst = total > 0 ? Math.round((againstCount / total) * 100) : 0
        transformedProposal.votesAbstain = total > 0 ? Math.round((abstainCount / total) * 100) : 0
        transformedProposal.userVoted = userVote

        setProposal(transformedProposal)

        // Fetch IPFS data for CONTRIBUTION_RECONCILIATION proposals
        if (proposalData.proposal_type === "CONTRIBUTION_RECONCILIATION" && proposalData.ipfs_hash) {
          try {
            const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${proposalData.ipfs_hash}`
            const ipfsResponse = await fetch(ipfsUrl)
            const ipfsData = await ipfsResponse.json()
            const entries = Array.isArray(ipfsData) ? ipfsData : ipfsData.entries || []
            setReconciliationData(entries)
            console.log("Loaded reconciliation data:", entries)
          } catch (ipfsError) {
            console.error("Failed to fetch IPFS reconciliation data:", ipfsError)
          }
        }

        // Fetch IPFS data for LOAN_REQUEST proposals
        if (proposalData.proposal_type === "LOAN_REQUEST" && proposalData.ipfs_hash) {
          try {
            const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${proposalData.ipfs_hash}`
            const ipfsResponse = await fetch(ipfsUrl)
            const data = await ipfsResponse.json()
            setLoanData(data)
            console.log("Loaded loan request data:", data)
          } catch (ipfsError) {
            console.error("Failed to fetch IPFS loan data:", ipfsError)
          }
        }

        // Fetch IPFS data for LOAN_REPAYMENT proposals
        if (proposalData.proposal_type === "LOAN_REPAYMENT" && proposalData.ipfs_hash) {
          try {
            const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${proposalData.ipfs_hash}`
            const ipfsResponse = await fetch(ipfsUrl)
            const data = await ipfsResponse.json()
            setRepaymentData(data)
            console.log("Loaded repayment data:", data)
          } catch (ipfsError) {
            console.error("Failed to fetch IPFS repayment data:", ipfsError)
          }
        }

      } catch (error) {
        console.error("Error fetching proposal details:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProposalData()
  }, [proposalId, address, isSuccess]) // Re-fetch on success (new vote)

  // Update chama name when chama data loads
  useEffect(() => {
    if (proposal && chama) {
      setProposal((prev: any) => ({ ...prev, chamaName: chama.name }))
    }
  }, [chama])

  // Fetch blockchain data for proposal
  useEffect(() => {
    const fetchBlockchainData = async () => {
      if (!governorAddress || !proposal?.on_chain_proposal_id) return

      try {
        const { ethers } = await import('ethers')
        const { BLOCKCHAIN_CONFIG } = await import('@/lib/blockchain-config')

        const provider = new ethers.JsonRpcProvider(BLOCKCHAIN_CONFIG.RPC_URL)
        const governor = new ethers.Contract(governorAddress, CHAMA_GOVERNOR_ABI, provider)
        const proposalIdBigInt = BigInt(proposal.on_chain_proposal_id)

        // Try each call separately to handle partial failures
        let proposalState = "Unknown"
        let state = -1
        try {
          state = Number(await governor.state(proposalIdBigInt))
          const states = ["Pending", "Active", "Canceled", "Defeated", "Succeeded", "Queued", "Expired", "Executed"]
          proposalState = states[state] || "Unknown"
        } catch (err) {
          console.error("Error fetching proposal state:", err)
        }

        // Get vote counts from blockchain
        let againstVotes = 0
        let forVotes = 0
        let abstainVotes = 0
        try {
          const proposalVotes = await governor.proposalVotes(proposalIdBigInt)
          againstVotes = Number(proposalVotes[0])
          forVotes = Number(proposalVotes[1])
          abstainVotes = Number(proposalVotes[2])
        } catch (err) {
          console.error("Error fetching vote counts:", err)
        }

        const totalVotes = againstVotes + forVotes + abstainVotes

        // Check if user has voted
        let userHasVoted = false
        let userVoteChoice = null
        if (address) {
          try {
            userHasVoted = await governor.hasVoted(proposalIdBigInt, address)

            if (userHasVoted && votes.length > 0) {
              const userVoteRecord = votes.find(v => v.voter?.toLowerCase() === address.toLowerCase())
              userVoteChoice = userVoteRecord?.support || null
            }
          } catch (err) {
            console.error("Error checking user vote:", err)
          }
        }

        // Get proposal deadline and voting start
        let deadlineBlock = 0
        let blocksRemaining = 0
        let hoursRemaining = 0
        let votingStartBlock = 0
        let blocksUntilVotingStarts = 0
        let hoursUntilVotingStarts = 0
        let votingHasStarted = false

        try {
          const currentBlock = await provider.getBlockNumber()

          // Get deadline
          const deadline = await governor.proposalDeadline(proposalIdBigInt)
          deadlineBlock = Number(deadline)
          blocksRemaining = Math.max(0, deadlineBlock - currentBlock)
          hoursRemaining = Math.ceil((blocksRemaining * 2) / 3600)

          // Get voting start (snapshot + delay)
          const votingDelay = await governor.votingDelay()
          const proposalSnapshot = await governor.proposalSnapshot(proposalIdBigInt)
          votingStartBlock = Number(proposalSnapshot) + Number(votingDelay)

          blocksUntilVotingStarts = Math.max(0, votingStartBlock - currentBlock)
          hoursUntilVotingStarts = Math.ceil((blocksUntilVotingStarts * 2) / 3600)
          votingHasStarted = currentBlock >= votingStartBlock

        } catch (err) {
          console.error("Error fetching deadline:", err)
        }

        // Skip quorum query - not all governors implement it the same way
        // and it's not critical for the UI
        let quorumNeeded = 0

        // Update proposal with blockchain data
        setProposal((prev: any) => ({
          ...prev,
          // Blockchain data
          blockchainState: proposalState,
          stateNumber: state,
          isActive: state === 1,
          isPending: state === 0,
          isSucceeded: state === 4,
          isDefeated: state === 3,
          isExecuted: state === 7,
          // Vote counts from blockchain (source of truth)
          forVotesCount: forVotes,
          againstVotesCount: againstVotes,
          abstainVotesCount: abstainVotes,
          totalVotesCount: totalVotes,
          // Percentages
          votesFor: totalVotes > 0 ? Math.round((forVotes / totalVotes) * 100) : 0,
          votesAgainst: totalVotes > 0 ? Math.round((againstVotes / totalVotes) * 100) : 0,
          votesAbstain: totalVotes > 0 ? Math.round((abstainVotes / totalVotes) * 100) : 0,
          // User vote status
          userHasVoted,
          userVoted: userVoteChoice,
          // Deadline info
          deadlineBlock,
          blocksRemaining,
          hoursRemaining,
          // Voting start info
          votingStartBlock,
          blocksUntilVotingStarts,
          hoursUntilVotingStarts,
          votingHasStarted,
          canVote: state === 1 && votingHasStarted && !userHasVoted,
          // Quorum
          quorumNeeded,
          quorumMet: forVotes >= quorumNeeded
        }))

        console.log('Blockchain data:', {
          state: proposalState,
          forVotes,
          againstVotes,
          abstainVotes,
          userHasVoted,
          votingHasStarted,
          hoursUntilVotingStarts,
          blocksRemaining,
          quorumNeeded,
          quorumMet: forVotes >= quorumNeeded
        })

      } catch (error: any) {
        console.error("Error fetching blockchain data:", error)
        // Show friendly error message for rate limits
        if (error.message?.includes("Too Many Requests") || error.code === "BAD_DATA") {
          console.warn("Rate limit hit - blockchain data will retry on next user action")
        }
      }
    }

    fetchBlockchainData()

    // Only re-fetch when these specific values change, not on every isSuccess
  }, [governorAddress, proposal?.on_chain_proposal_id, address])


  useEffect(() => {
    if (isSuccess && receipt && user) {
      const syncToSupabase = async () => {
        try {
          // 1. Check for VoteCast event
          const voteEvent = receipt.logs.find(log => {
            try {
              const decoded = decodeEventLog({
                abi: CHAMA_GOVERNOR_ABI,
                data: log.data,
                topics: log.topics
              }) as any
              return decoded.eventName === 'VoteCast'
            } catch {
              return false
            }
          })

          if (voteEvent) {
            const decoded = decodeEventLog({
              abi: CHAMA_GOVERNOR_ABI,
              data: voteEvent.data,
              topics: voteEvent.topics
            }) as any
            const args = decoded.args
            const support = Number(args.support)

            // Handle voting power (cap at max int if needed)
            let votingPower = Number(args.weight);
            if (votingPower > 2147483647) {
              console.warn("Voting power exceeds integer limit, capping at max int");
              votingPower = 2147483647;
            }

            // Insert into Supabase
            const { error } = await supabase.from('votes').insert({
              proposal_id: proposalId,
              user_id: user.user_id,
              vote_choice: support === 1 ? "for" : support === 0 ? "against" : "abstain",
              voting_power: votingPower,
              comment: args.reason || null,
              on_chain_tx_hash: receipt.transactionHash,
              blockchain_signature: null
            })

            if (error && error.code !== '23505') {
              console.error("Supabase vote insert error:", error)
            } else {
              console.log("Vote recorded successfully!")
              refetchState() // Refresh state
            }
          }

          // 2. Check for ProposalExecuted event
          const executeEvent = receipt.logs.find(log => {
            try {
              const decoded = decodeEventLog({
                abi: CHAMA_GOVERNOR_ABI,
                data: log.data,
                topics: log.topics
              }) as any
              return decoded.eventName === 'ProposalExecuted'
            } catch {
              return false
            }
          })

          if (executeEvent) {
            console.log("Proposal Executed on-chain!")
            // Update proposal status in Supabase
            const { error } = await supabase
              .from('proposals')
              .update({ status: 'Executed' })
              .eq('proposal_id', proposalId)

            if (error) {
              console.error("Error updating proposal status:", error)
            } else {
              setProposal({ ...proposal, status: 'Executed' })
              refetchState()

              // Trigger backend processing based on proposal type
              try {
                const proposalType = proposal?.proposal_type
                console.log(`Triggering backend processing for ${proposalType}`)

                if (proposalType === 'CONTRIBUTION_RECONCILIATION') {
                  // Process reconciliation to update treasury
                  const response = await fetch('/api/reconciliation/process', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ proposalId })
                  })
                  const result = await response.json()
                  console.log('Reconciliation processing result:', result)
                } else if (proposalType === 'LOAN_REQUEST') {
                  // Process loan to update loans table
                  const response = await fetch('/api/loans/process', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ proposalId })
                  })
                  const result = await response.json()
                  console.log('Loan processing result:', result)
                } else if (proposalType === 'LOAN_REPAYMENT') {
                  // Process loan repayment to update loan balance and create repayment record
                  const response = await fetch('/api/repayments/process', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ proposalId })
                  })
                  const result = await response.json()
                  console.log('Repayment processing result:', result)
                }
              } catch (processingError) {
                console.error('Error triggering backend processing:', processingError)
                // Don't fail the execution - just log the error
              }
            }
          }

        } catch (err) {
          console.error("Error syncing to Supabase:", err)
        }
      }
      syncToSupabase()
    }
  }, [isSuccess, receipt, proposalId, user, refetchState])

  const handleVote = async (support: number) => {
    if (!proposal || !governorAddress) return;
    try {
      await castVote(BigInt(proposal.on_chain_proposal_id), support)
    } catch (error) {
      console.error("Error casting vote:", error)
    }
  }

  const handleExecute = async () => {
    if (!proposal || !governorAddress) {
      console.warn("Missing proposal or governor address");
      return;
    };

    // Check if the proposal is already executed
    if (proposal.isExecuted) {
      toast.error("Proposal is already executed");
      return;
    }

    try {
      console.log("Attempting to execute proposal", proposal.on_chain_proposal_id);
      const description = `ipfs://${proposal.ipfs_hash}`;
      const descriptionHash = keccak256(stringToBytes(description));

      // Signal Proposal Parameters (Target=Governor, Value=0, Data=0x)
      await execute(
        [governorAddress as `0x${string}`],
        [BigInt(0)],
        ["0x"],
        descriptionHash
      );
      toast.success("Execution transaction submitted", { description: "Check your wallet for confirmation" });
    } catch (error) {
      console.error("Error executing proposal:", error);
      toast.error("Failed to execute proposal", { description: error instanceof Error ? error.message : "Unknown error" });
    }
  }



  const isVoting = isPending || isConfirming

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--kente-orange)]" />
      </div>
    )
  }

  if (!proposal) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4">
        <p className="text-muted-foreground">Proposal not found</p>
        <Button onClick={() => router.push("/dashboard")}>Go to Dashboard</Button>
      </div>
    )
  }

  // Use blockchain state as source of truth
  const isActive = proposal.isActive || proposal.stateNumber === 1
  const isPassing = proposal.votesFor >= (proposal.threshold || 50)

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumbs */}
      <div className="container mx-auto px-4 py-3 border-b bg-background/80 backdrop-blur-sm">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground" aria-label="Breadcrumb">
          <a
            href="/dashboard"
            className="hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--kente-orange)] rounded px-1"
          >
            Dashboard
          </a>
          <ChevronRight className="w-4 h-4" />
          <a
            href={`/chama/${proposal.chamaId}`}
            className="hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--kente-orange)] rounded px-1"
          >
            {proposal.chamaName}
          </a>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground font-medium">
            {proposal.code}
          </span>
        </nav>
      </div>

      {/* Header */}
      <div className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-6">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 mb-4"
            onClick={() => router.push(`/chama/${proposal.chamaId}`)}
            aria-label="Back to chama"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to {proposal.chamaName}</span>
            <span className="sm:hidden">Back</span>
          </Button>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge variant="outline" className="font-mono">
                  {proposal.code}
                </Badge>
                <Badge variant={
                  proposal.blockchainState === "Active" ? "default" :
                    proposal.blockchainState === "Succeeded" ? "default" :
                      proposal.blockchainState === "Defeated" ? "destructive" :
                        "secondary"
                }>
                  {proposal.blockchainState || proposal.status}
                </Badge>
                <Badge variant="outline">{proposal.type}</Badge>
                {proposal.userVoted && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    ✓ You voted {proposal.userVoted}
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl sm:text-4xl font-heading font-bold mb-3">{proposal.title}</h1>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm text-muted-foreground">
                <span className="mobile-text-sm">Proposed by {proposal.proposer}</span>
                <span className="hidden sm:inline">•</span>
                <span className="flex items-center gap-1 mobile-text-sm">
                  <Calendar className="w-4 h-4" />
                  Created {proposal.created}
                </span>
                <span className="hidden sm:inline">•</span>
                <span className="flex items-center gap-1 mobile-text-sm">
                  <Calendar className="w-4 h-4" />
                  Ends {proposal.endDate}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Main Content - Order 2 on mobile, 1 on desktop */}
          <div className="lg:col-span-2 space-y-6 sm:space-y-8 order-2 lg:order-1 animate-fade-in">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed text-base">{proposal.description}</p>
              </CardContent>
            </Card>

            {/* Contribution Records Table (for CONTRIBUTION_RECONCILIATION proposals) */}
            {proposal.proposal_type === "CONTRIBUTION_RECONCILIATION" && reconciliationData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Contribution Records</CardTitle>
                  <CardDescription>Off-chain contributions submitted for approval</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border overflow-x-auto">
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
                        {reconciliationData.map((entry: any, index: number) => (
                          <tr key={index} className="border-b last:border-0 hover:bg-muted/30">
                            <td className="p-3 font-medium">{entry.memberName || entry.member || "N/A"}</td>
                            <td className="p-3 text-[var(--kente-orange)] font-semibold">KES {entry.amount?.toLocaleString() || 0}</td>
                            <td className="p-3 text-muted-foreground">{entry.date || "N/A"}</td>
                            <td className="p-3 text-muted-foreground">{entry.reference || "N/A"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Total Amount:</span>
                      <span className="text-lg font-bold text-[var(--kente-orange)]">
                        KES {reconciliationData.reduce((sum, entry) => sum + (entry.amount || 0), 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Loan Request Details (for LOAN_REQUEST proposals) */}
            {proposal.proposal_type === "LOAN_REQUEST" && loanData && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Loan Request Details</CardTitle>
                  <CardDescription>Loan terms and borrower information</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                      <div>
                        <p className="text-sm text-muted-foreground">Borrower</p>
                        <p className="font-medium">{loanData.borrowerName || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Principal Amount</p>
                        <p className="text-lg font-bold text-[var(--kente-orange)]">
                          KES {loanData.principalAmount?.toLocaleString() || 0}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
                      <div>
                        <p className="text-sm text-muted-foreground">Term</p>
                        <p className="font-medium">{loanData.termMonths} months</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Interest Rate</p>
                        <p className="font-medium">{loanData.interestRate}% p.a.</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Monthly Payment</p>
                        <p className="font-medium">KES {loanData.monthlyPayment?.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Purpose</p>
                        <p className="text-sm">{loanData.purpose || 'N/A'}</p>
                      </div>
                      {loanData.collateralDescription && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Collateral</p>
                          <p className="text-sm">{loanData.collateralDescription}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Loan Repayment Details (for LOAN_REPAYMENT proposals) */}
            {proposal.proposal_type === "LOAN_REPAYMENT" && repaymentData && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Repayment Details</CardTitle>
                  <CardDescription>Loan repayment verification information</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                      <div>
                        <p className="text-sm text-muted-foreground">Borrower</p>
                        <p className="font-medium">{repaymentData.borrowerName || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Payment Method</p>
                        <p className="font-medium">{repaymentData.paymentMethod || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <div>
                        <p className="text-sm text-green-700 dark:text-green-300">Repayment Amount</p>
                        <p className="text-2xl font-bold text-green-600">
                          KES {repaymentData.repaymentAmount?.toLocaleString() || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Payment Reference</p>
                        <p className="font-medium">{repaymentData.reference || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                      <div>
                        <p className="text-sm text-muted-foreground">Previous Balance</p>
                        <p className="font-medium">KES {repaymentData.previousBalance?.toLocaleString() || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">New Balance</p>
                        <p className="text-lg font-bold text-[var(--kente-orange)]">
                          KES {repaymentData.newBalance?.toLocaleString() || 0}
                        </p>
                      </div>
                    </div>
                    {repaymentData.newBalance === 0 && (
                      <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg text-center">
                        <p className="text-sm font-medium text-green-600">✅ This repayment fully settles the loan</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Proposal Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Proposal Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {proposal.amount && (
                  <div className="flex justify-between py-3 border-b">
                    <span className="text-muted-foreground">Loan Amount</span>
                    <span className="font-semibold text-[var(--kente-orange)] text-lg">{proposal.amount}</span>
                  </div>
                )}
                {/* Add other dynamic fields if available in metadata */}
              </CardContent>
            </Card>

            {/* Voters - with empty state */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Votes Cast ({proposal.voters.length})</CardTitle>
                <CardDescription>Members who have voted on this proposal</CardDescription>
              </CardHeader>
              <CardContent>
                {proposal.voters.length === 0 ? (
                  <div className="p-12 text-center empty-state">
                    <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                      <Users className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No Votes Yet</h3>
                    <p className="text-muted-foreground mb-6">
                      Be the first to vote on this proposal!
                    </p>
                    {!proposal.userVoted && isActive && (
                      <Button onClick={() => handleVote(1)} disabled={isVoting}>
                        {isVoting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Cast Your Vote
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {proposal.voters.map((voter: any, index: number) => (
                      <div key={index} className="flex items-center justify-between py-3 border-b last:border-0 keyboard-navigable">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--kente-orange)]/20 to-[var(--ankara-teal)]/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-semibold">{voter.name.substring(0, 2)}</span>
                          </div>
                          <span className="font-medium">{voter.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground hidden sm:inline">{voter.date}</span>
                          <Badge
                            variant="outline"
                            className={
                              voter.vote === "For" ? "bg-green-50 text-green-700 border-green-200" :
                                voter.vote === "Against" ? "bg-red-50 text-red-700 border-red-200" :
                                  "bg-gray-50 text-gray-700 border-gray-200"
                            }
                          >
                            {voter.vote === "For" && <CheckCircle2 className="w-3 h-3 mr-1" />}
                            {voter.vote === "Against" && <XCircle className="w-3 h-3 mr-1" />}
                            {voter.vote === "Abstain" && <MinusCircle className="w-3 h-3 mr-1" />}
                            {voter.vote}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Order 1 on mobile, 2 on desktop with background */}
          <div className="space-y-6 order-1 lg:order-2 animate-fade-in">
            {/* Voting Status */}
            <Card className="bg-muted/30">
              <CardHeader>
                <CardTitle className="text-xl">Voting Status</CardTitle>
                <CardDescription>
                  {proposal.totalVotes} votes cast
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Threshold</span>
                    <span className="font-semibold">{proposal.threshold}%</span>
                  </div>
                  <Progress value={proposal.votesFor} className="h-3" />
                  <div className="flex justify-between text-sm">
                    <span className={isPassing ? "text-green-600 font-semibold" : "text-muted-foreground"}>
                      {proposal.votesFor}% For
                    </span>
                    <span className={isPassing ? "text-green-600 font-semibold" : "text-muted-foreground"}>
                      {isPassing ? "✓ Passing" : "Not Passing"}
                    </span>
                  </div>
                </div>

                {/* Mobile-friendly vote breakdown */}
                <div className="flex justify-around gap-2 pt-4 border-t">
                  <div className="text-center flex-1">
                    <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <p className="text-2xl font-bold text-green-600">{proposal.votesFor}%</p>
                    <p className="text-xs text-muted-foreground">For</p>
                  </div>
                  <div className="text-center flex-1">
                    <div className="flex items-center justify-center gap-1 text-red-600 mb-1">
                      <XCircle className="w-4 h-4" />
                    </div>
                    <p className="text-2xl font-bold text-red-600">{proposal.votesAgainst}%</p>
                    <p className="text-xs text-muted-foreground">Against</p>
                  </div>
                  <div className="text-center flex-1">
                    <div className="flex items-center justify-center gap-1 text-gray-600 mb-1">
                      <MinusCircle className="w-4 h-4" />
                    </div>
                    <p className="text-2xl font-bold text-gray-600">{proposal.votesAbstain}%</p>
                    <p className="text-xs text-muted-foreground">Abstain</p>
                  </div>
                </div>



                <div className="mt-6 pt-4 border-t">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold">Cast your vote</h3>
                    <Badge variant="outline">
                      {proposalState === 4 ? "Succeeded" :
                        proposalState === 5 ? "Queued" :
                          proposalState === 7 ? "Executed" :
                            proposalState === 3 ? "Defeated" : "Active"}
                    </Badge>
                  </div>
                  {proposalState === 7 && (
                    <p className="text-xs text-muted-foreground">Proposal executed</p>
                  )}

                  {(proposalState === 4 || proposalState === 5) ? (
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                      onClick={handleExecute}
                      disabled={isPending || isConfirming}
                    >
                      {isPending || isConfirming ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Executing...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Execute Proposal
                        </>
                      )}
                    </Button>
                  ) : (
                    <div className="grid grid-cols-3 gap-3">
                      <Button
                        variant="outline"
                        className="border-green-200 hover:bg-green-50 text-green-700"
                        onClick={() => handleVote(1)}
                        disabled={isVoting || proposalState !== 1}
                      >
                        For
                      </Button>
                      <Button
                        variant="outline"
                        className="border-red-200 hover:bg-red-50 text-red-700"
                        onClick={() => handleVote(0)}
                        disabled={isVoting || proposalState !== 1}
                      >
                        Against
                      </Button>
                      <Button
                        variant="outline"
                        className="border-gray-200 hover:bg-gray-50 text-gray-700"
                        onClick={() => handleVote(2)}
                        disabled={isVoting || proposalState !== 1}
                      >
                        Abstain
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card className="bg-muted/30">
              <CardHeader>
                <CardTitle className="text-xl">Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-[var(--kente-orange)] mt-2 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-sm">Proposal Created</p>
                    <p className="text-xs text-muted-foreground">{proposal.created}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-muted mt-2 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-sm">Voting Ends</p>
                    <p className="text-xs text-muted-foreground">{proposal.endDate}</p>
                  </div>
                </div>
                {isPassing && (
                  <div className="flex items-start gap-3 animate-celebrate">
                    <div className="w-2 h-2 rounded-full bg-green-600 mt-2 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-green-600">Will Execute 🎉</p>
                      <p className="text-xs text-muted-foreground">If threshold maintained</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div >
      </div >
    </div >
  )
}

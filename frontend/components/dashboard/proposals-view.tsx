// components/dashboard/proposals-view.tsx
"use client"

import type React from "react"
import {
  uploadProposalToIPFS,
  generateAddMemberTemplate,
  generateRemoveMemberTemplate,
  generateLoanRequestTemplate,
  // generateContributionTemplate, // REMOVED
  generateConstitutionEditTemplate,
  generateMemberExitTemplate,
  generateIPFSConstitutionTemplate,
  recordProposal,
  recordVote,
} from "@/app/actions/proposals"
import { useEffect, useState } from "react"
import { useSendEvmTransaction } from "@coinbase/cdp-hooks"
import { useWaitForTransactionReceipt } from "wagmi"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getSupabaseClient } from "@/lib/supabase-client"
import type { Proposal } from "@/lib/types"
import { Plus, Loader2 } from "lucide-react" // Removed unused icons
import {
  AddMemberForm,
  LoanRequestForm,
  // ContributionForm, // REMOVED
  ConstitutionEditForm,
} from "./proposal-forms"
import { ReconciliationForm } from "./contributions/reconciliation-form"
import { submitReconciliation } from "@/app/actions/contributions"
import type { ProposalType } from "@/lib/blockchain-config"
import {
  encodeCastVote,
  encodeCreateProposal,
  extractProposalIdFromLogs,
} from "@/lib/blockchain-encoding"
import { ethers } from "ethers"
import { CHAMA_GOVERNOR_ABI } from "@/lib/contract-abis"
import { BLOCKCHAIN_CONFIG } from "@/lib/blockchain-config"
import { useUser } from "@/lib/UserContext"
import { toast } from "sonner"

// Import the new list component
import { ProposalList } from "./proposals/ProposalList"

export interface ProposalWithDetails extends Omit<Proposal, 'status'> {
  chamaName?: string
  creatorName?: string
  isCreator?: boolean
  isVotingActive?: boolean
  totalVotes?: number
  votingPercentage?: {
    for: number
    against: number
    abstain: number
  }
  governor_address?: string
  status?: string
  on_chain_proposal_id?: string
}

export function ProposalsView() {
  const { user, evmAddress, isLoading: isUserLoading } = useUser()

  const [proposals, setProposals] = useState<ProposalWithDetails[]>([])
  const [userVotes, setUserVotes] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedChama, setSelectedChama] = useState<string>("")
  const [chamas, setChamas] = useState<any[]>([])
  const [selectedProposalType, setSelectedProposalType] = useState<ProposalType | null>(null)
  const [isSubmittingProposal, setIsSubmittingProposal] = useState(false)

  const { sendEvmTransaction: sendTx } = useSendEvmTransaction()
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null)
  const [pendingProposalId, setPendingProposalId] = useState<string | null>(null)

  const supabase = getSupabaseClient()

  const {
    data: receipt,
    isLoading: isConfirmingReceipt,
    isSuccess: isConfirmed,
  } = useWaitForTransactionReceipt({
    hash: txHash ?? undefined,
    chainId: BLOCKCHAIN_CONFIG.CHAIN_ID,
  })

  useEffect(() => {
    if (isConfirmed && receipt && txHash && pendingProposalId) {
      const onChainId = extractProposalIdFromLogs(receipt, CHAMA_GOVERNOR_ABI)
      if (onChainId !== "0") {
        saveOnChainDataToSupabase(pendingProposalId, txHash, onChainId)
      }
      setTxHash(null)
      setPendingProposalId(null)
    }
  }, [isConfirmed, receipt, txHash, pendingProposalId])

  useEffect(() => {
    if (isUserLoading || !user) return
    fetchData()
  }, [user, isUserLoading])

  const fetchData = async () => {
    if (!user) return
    setLoading(true)

    const { data: memberData } = await supabase
      .from("chama_members")
      .select("chama_id")
      .eq("user_id", user.user_id)
    const chamaIds = memberData?.map((m: { chama_id: string }) => m.chama_id) || []

    const { data: chamasData } = await supabase.from("chamas").select("*").in("chama_id", chamaIds)
    setChamas(chamasData || [])

    const { data: proposalsData } = await supabase
      .from("proposals")
      .select("*, chamas(name, governor_address)")
      .in("chama_id", chamaIds)

    const { data: votesData } = await supabase
      .from("votes")
      .select("proposal_id, vote_choice")
      .eq("user_id", user.user_id)

    if (proposalsData) {
      const enrichedProposals = await Promise.all(
        proposalsData.map(async (proposal: any) => {
          const { data: creatorData } = await supabase
            .from("users")
            .select("first_name, last_name")
            .eq("user_id", proposal.creator_id)
            .single()

          const now = new Date()
          const votingEnd = proposal.voting_end ? new Date(proposal.voting_end) : null
          const isVotingActive = votingEnd ? now < votingEnd : true
          const totalVotes = proposal.votes_for + proposal.votes_against + proposal.votes_abstain

          return {
            ...proposal,
            chamaName: proposal.chamas?.name,
            governor_address: proposal.chamas?.governor_address,
            creatorName: creatorData ? `${creatorData.first_name} ${creatorData.last_name}` : "Unknown",
            isCreator: proposal.creator_id === user.user_id,
            isVotingActive,
            totalVotes,
            votingPercentage: {
              for: totalVotes > 0 ? (proposal.votes_for / totalVotes) * 100 : 0,
              against: totalVotes > 0 ? (proposal.votes_against / totalVotes) * 100 : 0,
              abstain: totalVotes > 0 ? (proposal.votes_abstain / totalVotes) * 100 : 0,
            },
          }
        })
      )
      setProposals(enrichedProposals)
    }
    setUserVotes(
      votesData?.reduce((acc: Record<string, string>, v: { proposal_id: string, vote_choice: string }) => ({ ...acc, [v.proposal_id]: v.vote_choice }), {}) || {}
    )
    setLoading(false)
  }

  const saveOnChainDataToSupabase = async (
    proposalId: string,
    txHash: `0x${string}`,
    onChainId: string
  ) => {
    const { error } = await supabase
      .from("proposals")
      .update({
        blockchain_tx_hash: txHash,
        on_chain_proposal_id: onChainId,
        status: "active",
      })
      .eq("proposal_id", proposalId)
    if (error) {
      toast.error("Failed to update proposal in DB", { description: error.message })
    } else {
      toast.success("Proposal confirmed on-chain!")
      fetchData() // Refresh all proposals
    }
  }

  const handleProposalSubmit = async (templateData: any) => {
    if (!user || !selectedChama || !selectedProposalType || !evmAddress || !sendTx) {
      toast.error("Submission Error", { description: "Missing required data. Please try again." })
      return
    }

    const toastId = toast.loading("Submitting proposal...")
    setIsSubmittingProposal(true)

    try {
      let template: any
      switch (selectedProposalType) {
        case "ADD_MEMBER":
          template = await generateAddMemberTemplate(templateData.memberEmail, templateData.memberName, templateData.votingPower)
          break
        case "LOAN_REQUEST":
          template = await generateLoanRequestTemplate(templateData.amount, templateData.currency, templateData.purpose, templateData.repaymentPeriod, templateData.interestRate)
          break
        // ... (other cases)
        case "CONSTITUTION_EDIT":
          template = await generateConstitutionEditTemplate(templateData.sectionTitle, templateData.oldContent, templateData.newContent)
          break
        case "CONTRIBUTION_RECONCILIATION":
          // Handled separately via submitReconciliation
          return
        default:
          throw new Error("Unknown proposal type")
      }

      const ipfsHash = await uploadProposalToIPFS(template)

      // We don't insert into DB yet, we wait for on-chain submission first?
      // Actually, the original code inserted into DB first with status 'active' (or pending?)
      // But the new recordProposal action handles insertion.
      // Let's prepare the data but call recordProposal AFTER sending tx or concurrently?
      // The original flow:
      // 1. Upload IPFS
      // 2. Insert DB (optimistic?)
      // 3. Send TX
      // 4. Update DB with TX hash

      // New flow with server action:
      // 1. Upload IPFS (client side helper calling server action) -> Done above
      // 2. Send TX (client side) -> We need the TX hash for the DB record to be complete?
      //    Or we can insert "pending" record first?
      //    The recordProposal action takes txHash. So we should send TX first.

      const { data: chamaData } = await supabase
        .from("chamas")
        .select("name, governor_address")
        .eq("chama_id", selectedChama)
        .single()
      if (!chamaData?.governor_address) throw new Error("Chama governor address not found.")

      const targets = [chamaData.governor_address]
      const values = [BigInt(0)]
      const calldatas = ["0x"]
      const descriptionHash = ethers.keccak256(ethers.toUtf8Bytes(`ipfs://${ipfsHash}`))

      const { to, data } = encodeCreateProposal(chamaData.governor_address, targets, values, calldatas, descriptionHash)

      const result = await sendTx({
        transaction: { to, data, value: BigInt(0), chainId: 84532, type: "eip1559" },
        evmAccount: evmAddress,
        network: "base-sepolia",
      })

      const txHash = result.transactionHash as `0x${string}`
      setTxHash(txHash)

      // Calculate on-chain ID (optimistic or wait for receipt?)
      // The receipt handling effect will update the DB if we rely on it.
      // But recordProposal inserts the initial record.
      // We can pass "pending..." as onChainId or wait.
      // Let's use "pending..." and let the effect update it, OR just rely on the effect?
      // But recordProposal sends the email! We want that to happen.
      // So we should call recordProposal here.

      const newProposal = await recordProposal(
        selectedChama,
        user.user_id,
        template.title,
        template.description,
        selectedProposalType,
        ipfsHash,
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        txHash,
        "pending..."
      )

      setPendingProposalId(newProposal.proposal_id)


      toast.success("Proposal submitted to blockchain", {
        id: toastId,
        description: "Waiting for confirmation...",
      })

      fetchData() // Optimistically refresh data
      setSelectedProposalType(null)
      setShowCreateForm(false)
    } catch (error: any) {
      toast.error("Error submitting proposal", { id: toastId, description: error.message })
    } finally {
      setIsSubmittingProposal(false)
    }
  }


  const handleReconciliationSubmit = async (data: any) => {
    if (!user || !selectedChama) return
    setIsSubmittingProposal(true)
    try {
      await submitReconciliation(selectedChama, user.user_id, data.entries)
      toast.success("Reconciliation proposal created!")
      fetchData()
      setShowCreateForm(false)
      setSelectedProposalType(null)
    } catch (error: any) {
      toast.error("Failed to submit reconciliation", { description: error.message })
    } finally {
      setIsSubmittingProposal(false)
    }
  }

  const handleVote = async (proposalId: string, choice: string) => {
    if (!user || !evmAddress || userVotes[proposalId]) return

    const proposal = proposals.find((p) => p.proposal_id === proposalId)
    if (!proposal?.governor_address || !proposal.on_chain_proposal_id || proposal.on_chain_proposal_id === "pending…") {
      toast.error("Cannot vote", { description: "Proposal not confirmed on-chain yet." })
      return
    }

    const toastId = toast.loading(`Casting vote (${choice})...`)

    try {
      const proposalIdBigInt = BigInt(proposal.on_chain_proposal_id)
      const supportValue = choice === "for" ? 1 : choice === "against" ? 0 : 2

      const provider = new ethers.JsonRpcProvider(BLOCKCHAIN_CONFIG.RPC_URL)
      const governor = new ethers.Contract(proposal.governor_address, CHAMA_GOVERNOR_ABI, provider)

      // Check voting delay (1 day = ~7200 blocks on Base Sepolia)
      const votingDelay = await governor.votingDelay()
      const proposalSnapshot = await governor.proposalSnapshot(proposalIdBigInt)
      const currentBlock = await provider.getBlockNumber()
      const votingStartBlock = Number(proposalSnapshot) + Number(votingDelay)
      const snapshot = await governor.proposalSnapshot(proposalIdBigInt);
      const tokenAddress = await governor.token(); // get the membership token address
      const token = new ethers.Contract(tokenAddress, [
        "function delegates(address) view returns (address)",
        "function getPastVotes(address account, uint256 blockNumber) view returns (uint256)"
      ], provider);

      const yourDelegatee = await token.delegates(evmAddress);
      const rawPastVotes = await token.getPastVotes(evmAddress, snapshot);

      console.log("Your current delegatee:", yourDelegatee);
      console.log("Raw past votes from token directly:", rawPastVotes.toString());
      const votesAtSnapshot = await governor.getVotes(evmAddress, snapshot);
      console.log("Your votes at snapshot block:", votesAtSnapshot.toString());
      if (currentBlock < votingStartBlock) {
        const blocksRemaining = votingStartBlock - currentBlock
        const hoursRemaining = Math.ceil((blocksRemaining * 2) / 3600) // ~2 sec per block
        throw new Error(`Voting starts in approximately ${hoursRemaining} hour(s). Please wait.`)
      }

      const state = Number(await governor.state(proposalIdBigInt));
      if (state !== 1) {
        const states = ["Pending", "Active", "Canceled", "Defeated", "Succeeded", "Queued", "Expired", "Executed"];
        throw new Error(`Cannot vote yet — proposal is ${states[state]} (${state})`);
      }
      const hasVoted = await governor.hasVoted(proposalIdBigInt, evmAddress)
      if (hasVoted) throw new Error("You have already voted on this proposal")

      const votingPower = await governor.getVotes(evmAddress, await provider.getBlockNumber() - 1)
      if (votingPower === 0) throw new Error("You have no voting power")

      const { to, data } = encodeCastVote(proposal.governor_address, proposalIdBigInt, supportValue)

      const { transactionHash } = await sendTx({
        transaction: { to, data, value: BigInt(0), chainId: 84532, type: "eip1559" },
        evmAccount: evmAddress,
        network: "base-sepolia",
      })

      await recordVote(
        proposalId,
        user.user_id,
        choice,
        1, // votingPower
        transactionHash as string
      )

      toast.success("Vote cast successfully!", { id: toastId })
      fetchData() // Refresh data to show new vote
    } catch (error: any) {
      toast.error("Vote failed", { id: toastId, description: error.message })
    }
  }

  if (isUserLoading || loading) {
    return <div className="p-8">Loading proposals...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Proposals</h1>
          <p className="text-muted-foreground">Vote on chama decisions</p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)} className="gap-2">
          <Plus className="w-4 h-4" />
          {showCreateForm ? "Cancel" : "Create"}
        </Button>
      </div>

      {txHash && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="flex items-center gap-3 py-4">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <div>
              <p className="font-medium">Confirming on-chain transaction…</p>
              <p className="text-sm text-muted-foreground truncate">
                {txHash}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Proposal</CardTitle>
            <CardDescription>Select a proposal type to continue</CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedProposalType ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Chama</label>
                  <select
                    className="w-full px-3 py-2 border border-input rounded-md"
                    value={selectedChama}
                    onChange={(e) => setSelectedChama(e.target.value)}
                    required
                  >
                    <option value="">Choose a chama...</option>
                    {chamas.map((c) => (
                      <option key={c.chama_id} value={c.chama_id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <Button variant="outline" onClick={() => setSelectedProposalType("ADD_MEMBER")} className="h-auto flex-col justify-start">
                    <div className="font-semibold">Add Member</div>
                    <div className="text-xs text-muted-foreground">Propose new member</div>
                  </Button>
                  <Button variant="outline" onClick={() => setSelectedProposalType("LOAN_REQUEST")} className="h-auto flex-col justify-start">
                    <div className="font-semibold">Loan Request</div>
                    <div className="text-xs text-muted-foreground">Request funds</div>
                  </Button>
                  <Button variant="outline" onClick={() => setSelectedProposalType("CONSTITUTION_EDIT")} className="h-auto flex-col justify-start">
                    <div className="font-semibold">Edit Constitution</div>
                    <div className="text-xs text-muted-foreground">Propose rules change</div>
                  </Button>
                  <Button variant="outline" onClick={() => setSelectedProposalType("CONTRIBUTION_RECONCILIATION")} className="h-auto flex-col justify-start">
                    <div className="font-semibold">Reconcile Contributions</div>
                    <div className="text-xs text-muted-foreground">Record off-chain funds</div>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedProposalType === "ADD_MEMBER" && (
                  <AddMemberForm chamaId={selectedChama} onSubmit={handleProposalSubmit} isLoading={isSubmittingProposal} />
                )}
                {selectedProposalType === "LOAN_REQUEST" && (
                  <LoanRequestForm chamaId={selectedChama} onSubmit={handleProposalSubmit} isLoading={isSubmittingProposal} />
                )}
                {/* Removed ContributionForm */}
                {selectedProposalType === "CONSTITUTION_EDIT" && (
                  <ConstitutionEditForm chamaId={selectedChama} onSubmit={handleProposalSubmit} isLoading={isSubmittingProposal} />
                )}
                {selectedProposalType === "CONTRIBUTION_RECONCILIATION" && (
                  <ReconciliationForm chamaId={selectedChama} onSubmit={handleReconciliationSubmit} isLoading={isSubmittingProposal} />
                )}
                <Button variant="outline" onClick={() => setSelectedProposalType(null)} className="w-full">
                  Back to Types
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Render the new ProposalList component */}
      <ProposalList
        proposals={proposals}
        userVotes={userVotes}
        onVote={handleVote}
      />

    </div>
  )
}

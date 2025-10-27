// app/proposal/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useIsSignedIn, useEvmAddress } from "@coinbase/cdp-hooks"
import { usePathname, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getSupabaseClient } from "@/lib/supabase-client"
import type { Proposal } from "@/lib/types"
import { Plus, Edit2, Trash2, Clock, Home, Users, Vote, User as UserIcon, Menu, LogOut } from "lucide-react"
import Sidebar from "@/components/dashboard/sidebar"


interface ProposalWithDetails extends Proposal {
  chamaName?: string
  creatorName?: string
  isCreator?: boolean
  isVotingActive?: boolean
}

export default function Proposal() {
  const [proposals, setProposals] = useState<ProposalWithDetails[]>([])
  const [userVotes, setUserVotes] = useState<Record<string, string>>({})
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingProposal, setEditingProposal] = useState<string | null>(null)
  const [selectedChama, setSelectedChama] = useState<string>("")
  const [chamas, setChamas] = useState<any[]>([])
  const [formData, setFormData] = useState({ title: "", description: "", type: "" })
  const [userId, setUserId] = useState<string | null>(null)
  const { isSignedIn } = useIsSignedIn()
  const router = useRouter()
  const { evmAddress } = useEvmAddress()

  useEffect(() => {
    if (!isSignedIn) {
      router.push("/auth")
      return
    }

    const fetchData = async () => {
      const supabase = getSupabaseClient()
      const { data: session } = await supabase.auth.getSession()
      const walletAddress = evmAddress
      if (!walletAddress) return

      const { data: userData } = await supabase
        .from("users")
        .select("user_id")
        .eq("wallet_address", walletAddress)
        .single()

      if (!userData) return
      setUserId(userData.user_id)

      const { data: memberData } = await supabase
        .from("chama_members")
        .select("chama_id")
        .eq("user_id", userData.user_id)

      const chamaIds = memberData?.map((m) => m.chama_id) || []
      const { data: chamasData } = await supabase.from("chamas").select("*").in("chama_id", chamaIds)
      setChamas(chamasData || [])

      const { data: proposalsData } = await supabase.from("proposals").select("*").in("chama_id", chamaIds)

      if (proposalsData) {
        const enrichedProposals = await Promise.all(
          proposalsData.map(async (proposal) => {
            const { data: chamaData } = await supabase
              .from("chamas")
              .select("name")
              .eq("chama_id", proposal.chama_id)
              .single()

            const { data: creatorData } = await supabase
              .from("users")
              .select("first_name, last_name")
              .eq("user_id", proposal.creator_id)
              .single()

            const now = new Date()
            const votingEnd = proposal.voting_end ? new Date(proposal.voting_end) : null
            const isVotingActive = votingEnd ? now < votingEnd : true

            return {
              ...proposal,
              chamaName: chamaData?.name,
              creatorName: creatorData ? `${creatorData.first_name} ${creatorData.last_name}` : "Unknown",
              isCreator: proposal.creator_id === userData.user_id,
              isVotingActive,
            }
          })
        )
        setProposals(enrichedProposals)
      }

      const { data: votesData } = await supabase
        .from("votes")
        .select("proposal_id, vote_choice")
        .eq("user_id", userData.user_id)

      setUserVotes(votesData?.reduce((acc, v) => ({ ...acc, [v.proposal_id]: v.vote_choice }), {}) || {})
    }

    fetchData()
  }, [isSignedIn, router])

  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId || !selectedChama) return

    const supabase = getSupabaseClient()

    if (editingProposal) {
      const { error } = await supabase
        .from("proposals")
        .update({
          title: formData.title,
          description: formData.description,
          proposal_type: formData.type,
        })
        .eq("proposal_id", editingProposal)

      if (error) {
        console.error("Error updating proposal:", error)
      } else {
        const updatedProposals = proposals.map((p) =>
          p.proposal_id === editingProposal
            ? {
                ...p,
                title: formData.title,
                description: formData.description,
                proposal_type: formData.type,
              }
            : p
        )
        setProposals(updatedProposals)
        setEditingProposal(null)
        setFormData({ title: "", description: "", type: "" })
        setShowCreateForm(false)
      }
    } else {
      const { data: newProposal, error } = await supabase
        .from("proposals")
        .insert({
          chama_id: selectedChama,
          creator_id: userId,
          title: formData.title,
          description: formData.description,
          proposal_type: formData.type,
          voting_start: new Date(),
          voting_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        })
        .select()
        .single()

      if (error) {
        console.error("Error creating proposal:", error)
      } else {
        const { data: chamaData } = await supabase.from("chamas").select("name").eq("chama_id", selectedChama).single()
        setProposals([
          ...proposals,
          {
            ...newProposal,
            chamaName: chamaData?.name,
            creatorName: "You",
            isCreator: true,
            isVotingActive: true,
          },
        ])
        setFormData({ title: "", description: "", type: "" })
        setShowCreateForm(false)
      }
    }
  }

  const handleEditProposal = (proposal: ProposalWithDetails) => {
    setEditingProposal(proposal.proposal_id)
    setSelectedChama(proposal.chama_id)
    setFormData({
      title: proposal.title,
      description: proposal.description || "",
      type: proposal.proposal_type || "",
    })
    setShowCreateForm(true)
  }

  const handleDeleteProposal = async (proposalId: string) => {
    if (!confirm("Are you sure you want to delete this proposal?")) return

    const supabase = getSupabaseClient()
    const { error } = await supabase.from("proposals").delete().eq("proposal_id", proposalId)

    if (error) {
      console.error("Error deleting proposal:", error)
    } else {
      setProposals(proposals.filter((p) => p.proposal_id !== proposalId))
    }
  }

  const handleVote = async (proposalId: string, choice: string) => {
    if (!userId) return

    const supabase = getSupabaseClient()

    if (userVotes[proposalId]) {
      console.error("Already voted on this proposal")
      return
    }

    const { error } = await supabase.from("votes").insert({
      proposal_id: proposalId,
      user_id: userId,
      vote_choice: choice,
      voting_power: 1,
    })

    if (error) {
      console.error("Error voting:", error)
    } else {
      setUserVotes({ ...userVotes, [proposalId]: choice })
      const updatedProposals = proposals.map((p) => {
        if (p.proposal_id === proposalId) {
          return {
            ...p,
            votes_for: choice === "for" ? p.votes_for + 1 : p.votes_for,
            votes_against: choice === "against" ? p.votes_against + 1 : p.votes_against,
            votes_abstain: choice === "abstain" ? p.votes_abstain + 1 : p.votes_abstain,
          }
        }
        return p
      })
      setProposals(updatedProposals)
    }
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-background">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Proposals</h1>
            <p className="text-muted-foreground">Vote on chama decisions</p>
          </div>
          <Button onClick={() => setShowCreateForm(!showCreateForm)} className="gap-2">
            <Plus className="w-4 h-4" />
            {editingProposal ? "Cancel Edit" : "Create Proposal"}
          </Button>
        </div>

        {showCreateForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>{editingProposal ? "Edit Proposal" : "Create New Proposal"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateProposal} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Chama</label>
                  <select
                    className="w-full px-3 py-2 border border-input rounded-md"
                    value={selectedChama}
                    onChange={(e) => setSelectedChama(e.target.value)}
                    required
                    disabled={!!editingProposal}
                  >
                    <option value="">Choose a chama...</option>
                    {chamas.map((c) => (
                      <option key={c.chama_id} value={c.chama_id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    placeholder="Proposal title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <textarea
                    className="w-full px-3 py-2 border border-input rounded-md"
                    placeholder="Describe your proposal..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Type</label>
                  <Input
                    placeholder="e.g., Loan, Distribution, Investment"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  />
                </div>
                <div className="flex gap-4">
                  <Button type="submit">{editingProposal ? "Update" : "Create"}</Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCreateForm(false)
                      setEditingProposal(null)
                      setFormData({ title: "", description: "", type: "" })
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {proposals.map((proposal) => (
            <Card key={proposal.proposal_id} className={!proposal.isVotingActive ? "opacity-75" : ""}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle>{proposal.title}</CardTitle>
                    <CardDescription>
                      {proposal.chamaName} • {proposal.proposal_type}
                    </CardDescription>
                  </div>
                  {proposal.isCreator && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => handleEditProposal(proposal)} className="gap-2">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteProposal(proposal.proposal_id)}
                        className="gap-2 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{proposal.description}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{proposal.isVotingActive ? "Voting Active" : "Voting Closed"}</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="bg-muted p-3 rounded">
                    <p className="text-muted-foreground text-xs">For</p>
                    <p className="text-lg font-semibold">{proposal.votes_for}</p>
                  </div>
                  <div className="bg-muted p-3 rounded">
                    <p className="text-muted-foreground text-xs">Against</p>
                    <p className="text-lg font-semibold">{proposal.votes_against}</p>
                  </div>
                  <div className="bg-muted p-3 rounded">
                    <p className="text-muted-foreground text-xs">Abstain</p>
                    <p className="text-lg font-semibold">{proposal.votes_abstain}</p>
                  </div>
                </div>
                {userVotes[proposal.proposal_id] ? (
                  <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
                    You voted: <span className="font-semibold capitalize">{userVotes[proposal.proposal_id]}</span>
                  </div>
                ) : proposal.isVotingActive ? (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleVote(proposal.proposal_id, "for")}
                      variant="outline"
                      className="flex-1"
                    >
                      Vote For
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleVote(proposal.proposal_id, "against")}
                      variant="outline"
                      className="flex-1"
                    >
                      Vote Against
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleVote(proposal.proposal_id, "abstain")}
                      variant="outline"
                      className="flex-1"
                    >
                      Abstain
                    </Button>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">Voting has ended</div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {proposals.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No proposals yet</p>
            <Button onClick={() => setShowCreateForm(true)}>Create the first proposal</Button>
          </div>
        )}
      </main>
    </div>
  )
}

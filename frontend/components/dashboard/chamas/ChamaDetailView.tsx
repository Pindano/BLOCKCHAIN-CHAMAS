// components/dashboard/chamas/ChamaDetailView.tsx
"use client"

import { useEffect, useState } from "react"
import { getSupabaseClient } from "@/lib/supabase-client"
import { useParams, useRouter } from "next/navigation"
import { useUser } from "@/lib/UserContext"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Users, TrendingUp, Wallet, DollarSign, Clock, FileText, ChevronDown, ChevronUp, Plus, Vote
} from "lucide-react"
import Link from "next/link"
import { ProposalListItem } from "../ProposalListItem"
import { EmptyState } from "@/components/EmptyState"
import { CreateProposalModal } from "../proposals/CreateProposalModal"
import { PublishChamaButton } from "./PublishChamaButton"

interface ChamaData {
  chama: {
    chama_id: string
    name: string
    description: string
    constitution: string
    total_contributions: number
    governor_address: string
    status: string
  }
  stats: {
    totalContributions: number
    loansDisbursed: number
    memberCount: number
  }
  activeProposals: Array<{
    proposal_id: string
    title: string
    status: string
    voting_start: string
    voting_end: string
  }>
  members: Array<{
    user_id: string
    first_name: string
    last_name: string
    email: string
    total_contributions: number
  }>
  loans: Array<{
    loan_id: string
    borrower_id: string
    amount: number
    outstanding_balance: number
    status: string
    users: {
      first_name: string
      last_name: string
    }
  }>
}

export function ChamaDetailView() {
  const params = useParams()
  const router = useRouter()
  const chamaId = params.id as string
  const { user, isLoading: isUserLoading } = useUser()

  const [data, setData] = useState<ChamaData | null>(null)
  const [loading, setLoading] = useState(true)
  const [constitutionExpanded, setConstitutionExpanded] = useState(false)
  const [showCreateProposal, setShowCreateProposal] = useState(false)

  const supabase = getSupabaseClient()

  useEffect(() => {
    if (isUserLoading || !user) return
    fetchChamaData()
  }, [user, isUserLoading, chamaId])

  const fetchChamaData = async () => {
    setLoading(true)

    try {
      // Fetch all data in parallel
      const [chamaRes, membersRes, proposalsRes, contributionsRes, loansRes] = await Promise.all([
        supabase.from("chamas").select("*").eq("chama_id", chamaId).single(),
        supabase
          .from("chama_members")
          .select("user_id, users(user_id, first_name, last_name, email)")
          .eq("chama_id", chamaId),
        supabase
          .from("proposals")
          .select("*")
          .eq("chama_id", chamaId)
          .order("created_at", { ascending: false }),
        supabase
          .from("contributions")
          .select("amount, member_id")
          .eq("chama_id", chamaId)
          .eq("status", "verified"),
        supabase
          .from("loans")
          .select("loan_id, borrower_id, amount, outstanding_balance, status")
          .eq("chama_id", chamaId)
          .eq("status", "active")
      ])

      if (chamaRes.error) {
        toast.error("Failed to load Chama details")
        return
      }

      // Calculate stats
      const totalContributions = contributionsRes.data?.reduce(
        (sum: number, c: any) => sum + Number(c.amount), 0
      ) || 0

      const loansDisbursed = loansRes.data?.reduce(
        (sum: number, l: any) => sum + Number(l.amount), 0
      ) || 0

      // Filter active proposals (voting is currently ongoing)
      const now = new Date()
      const activeProposals = (proposalsRes.data || []).filter((p: any) => {
        const votingStart = p.voting_start ? new Date(p.voting_start) : null
        const votingEnd = p.voting_end ? new Date(p.voting_end) : null
        return votingStart && votingEnd && now >= votingStart && now < votingEnd
      })

      // Calculate member contributions
      const memberContributions = new Map()
      contributionsRes.data?.forEach((c: any) => {
        const current = memberContributions.get(c.member_id) || 0
        memberContributions.set(c.member_id, current + Number(c.amount))
      })

      const enrichedMembers = (membersRes.data || []).map((m: any) => ({
        user_id: m.users.user_id,
        first_name: m.users.first_name,
        last_name: m.users.last_name,
        email: m.users.email,
        total_contributions: memberContributions.get(m.user_id) || 0
      }))

      // Map loans to include user details from members list
      const loansWithUsers = (loansRes.data || []).map(loan => {
        const member = enrichedMembers.find(m => m.user_id === loan.borrower_id)
        return {
          ...loan,
          users: {
            first_name: member?.first_name || 'Unknown',
            last_name: member?.last_name || 'User'
          }
        }
      })

      setData({
        chama: chamaRes.data,
        stats: {
          totalContributions,
          loansDisbursed,
          memberCount: membersRes.data?.length || 0
        },
        activeProposals,
        members: enrichedMembers,
        loans: loansWithUsers
      })
    } catch (error) {
      console.error("Error fetching Chama data:", error)
      toast.error("Failed to load Chama details")
    } finally {
      setLoading(false)
    }
  }

  if (isUserLoading || loading) {
    return <ChamaSkeleton />
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Failed to load Chama details</p>
        <Button onClick={fetchChamaData} className="mt-4">Retry</Button>
      </div>
    )
  }

  const isDraft = data.chama.status === "draft"
  const isPublished = data.chama.status === "published"

  console.log("--- Chama Debug Info ---")
  console.log("Chama Name:", data.chama.name)
  console.log("Chama Status:", data.chama.status)
  console.log("Is Draft:", isDraft)
  console.log("Is Published:", isPublished)
  console.log("Governor Address:", data.chama.governor_address)
  console.log("------------------------")

  return (
    <div className="space-y-6">
      {/* Chama Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">{data.chama.name}</h1>
            {data.chama.description && (
              <p className="text-muted-foreground mt-1">{data.chama.description}</p>
            )}
          </div>
          {isDraft ? (
            <PublishChamaButton
              chamaId={chamaId}
              chamaName={data.chama.name}
              onPublished={fetchChamaData}
            />
          ) : (
            <Button size="lg" className="gap-2" onClick={() => setShowCreateProposal(true)}>
              <Plus className="w-5 h-5" />
              New Proposal
            </Button>
          )}
        </div>

        {/* Constitution */}
        {data.chama.constitution && (
          <Card>
            <CardHeader
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setConstitutionExpanded(!constitutionExpanded)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  <CardTitle className="text-lg">Constitution</CardTitle>
                </div>
                {constitutionExpanded ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
            </CardHeader>
            {constitutionExpanded && (
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {data.chama.constitution}
                </div>
              </CardContent>
            )}
            {!constitutionExpanded && (
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {data.chama.constitution}
                </p>
              </CardContent>
            )}
          </Card>
        )}
      </div>

      {isDraft && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-semibold text-yellow-900">Draft Mode</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  This Chama is in draft mode. Proposals and voting are disabled until you publish it on-chain.
                  Invite members to review the constitution, then click "Publish Chama" when ready.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contributions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              KES {data.stats.totalContributions.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Loans Disbursed</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              KES {data.stats.loansDisbursed.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.memberCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Active Proposals - Only show for active Chamas */}
      {!isDraft && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Active Proposals</h2>
            {data.activeProposals.length > 0 && (
              <Link href={`/dashboard/proposals?chama=${chamaId}`}>
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            )}
          </div>

          {data.activeProposals.length === 0 ? (
            <EmptyState
              icon={<Vote className="w-12 h-12 text-muted-foreground" />}
              title="No Active Proposals"
              description="There are no proposals currently open for voting"
              action={
                <Link href="/dashboard/proposals">
                  <Button variant="outline">Create Proposal</Button>
                </Link>
              }
            />
          ) : (
            <div className="space-y-2">
              {data.activeProposals.map((proposal) => (
                <ProposalListItem
                  key={proposal.proposal_id}
                  proposalId={proposal.proposal_id}
                  title={proposal.title}
                  status={proposal.status}
                  votingEnd={proposal.voting_end}
                  chamaName={data.chama.name}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Loans Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Active Loans</h2>
          <div className="flex gap-2">
            {isDraft ? (
              <Button variant="outline" size="sm" className="gap-2 opacity-50 cursor-not-allowed" disabled>
                <DollarSign className="w-4 h-4" />
                Request Loan
              </Button>
            ) : (
              <Link href={`/dashboard/loans/request?chamaId=${chamaId}`}>
                <Button variant="outline" size="sm" className="gap-2">
                  <DollarSign className="w-4 h-4" />
                  Request Loan
                </Button>
              </Link>
            )}

            {isDraft ? (
              <Button variant="outline" size="sm" className="gap-2 opacity-50 cursor-not-allowed" disabled>
                <Wallet className="w-4 h-4" />
                Record Repayment
              </Button>
            ) : (
              <Link href={`/dashboard/loans/repayments?chamaId=${chamaId}`}>
                <Button variant="outline" size="sm" className="gap-2">
                  <Wallet className="w-4 h-4" />
                  Record Repayment
                </Button>
              </Link>
            )}
          </div>
        </div>

        {isDraft ? (
          <Card className="bg-muted/50 border-dashed">
            <CardContent className="py-8 text-center text-muted-foreground">
              <p>Publish your Chama to enable loan requests and repayments.</p>
            </CardContent>
          </Card>
        ) : data.loans.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No active loans.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {data.loans.map((loan) => (
              <div
                key={loan.loan_id}
                className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--kente-orange)]/10 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-[var(--kente-orange)]" />
                  </div>
                  <div>
                    <p className="font-medium">{loan.users?.first_name} {loan.users?.last_name}</p>
                    <p className="text-sm text-muted-foreground">Active Loan</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-[var(--kente-orange)]">KES {loan.outstanding_balance?.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Outstanding Balance</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Members</h2>
        </div>

        <div className="space-y-2">
          {data.members.map((member) => (
            <div
              key={member.user_id}
              className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{member.first_name} {member.last_name}</p>
                  <p className="text-sm text-muted-foreground">{member.email}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium">KES {member.total_contributions.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total contributions</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Create Proposal Modal */}
      {showCreateProposal && data && (
        <CreateProposalModal
          isOpen={showCreateProposal}
          onClose={() => setShowCreateProposal(false)}
          chamaId={chamaId}
          chamaName={data.chama.name}
          governorAddress={data.chama.governor_address}
        />
      )}
    </div>
  )
}

function ChamaSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-4 w-96 mt-2" />
      </div>
      <Skeleton className="h-32 w-full" />
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <div className="space-y-3">
        <Skeleton className="h-6 w-48" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    </div>
  )
}

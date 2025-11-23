"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Users,
  TrendingUp,
  CheckCircle2,
  Crown,
  Plus,
  ArrowRight,
  Calendar,
  Loader2,
  Wallet
} from "lucide-react"
import { useUser } from "@/lib/UserContext"
import { supabase } from "@/lib/supabase"
import { InvitationsList } from "@/components/dashboard/InvitationsList"
import { DraftChamasList } from "@/components/dashboard/DraftChamasList"



export default function DashboardPage() {
  const router = useRouter()
  const { address, user } = useUser()
  const [chamas, setChamas] = useState<any[]>([])
  const [proposals, setProposals] = useState<any[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [stats, setStats] = useState({
    totalChamas: 0,
    totalWealth: "KES 0",
    contributionsMade: 0,
    proposalsVoted: 0,
    activeLoans: 0
  })

  useEffect(() => {
    const fetchData = async () => {
      if (!address || !user) return;

      try {
        setIsLoadingData(true);

        // 1. Fetch Chamas where user is a member
        const { data: memberChamas, error: memberError } = await supabase
          .from('chama_members')
          .select('chama_id')
          .eq('user_id', user.user_id);

        if (memberError) throw memberError;

        const chamaIds = (memberChamas || []).map(m => m.chama_id);

        const { data: chamasData, error: chamasError } = await supabase
          .from('chamas')
          .select('*')
          .in('chama_id', chamaIds.length > 0 ? chamaIds : ['']);

        if (chamasError) throw chamasError;

        // 2. Fetch User's Total Contributions
        const { data: contributionsData, error: contributionsError } = await supabase
          .from('contributions')
          .select('amount')
          .eq('member_id', user.user_id);

        if (contributionsError) console.error("Error fetching contributions:", contributionsError);

        const totalContributions = (contributionsData || []).reduce((sum, c) => sum + Number(c.amount), 0);
        const contributionsCount = (contributionsData || []).length;

        // 3. Fetch User's Active Loans
        const { data: loansData, error: loansError } = await supabase
          .from('loans')
          .select('principal_amount, outstanding_balance')
          .eq('borrower_id', user.user_id)
          .eq('status', 'active');

        if (loansError) console.error("Error fetching loans:", loansError);

        const activeLoansCount = (loansData || []).length;
        const totalLoanBalance = (loansData || []).reduce((sum, l) => sum + Number(l.outstanding_balance || 0), 0);

        // 4. Fetch User's Votes
        const { count: votesCount, error: votesError } = await supabase
          .from('votes')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.user_id);

        if (votesError) console.error("Error fetching votes:", votesError);

        // Calculate Total Wealth (Contributions - Outstanding Loans)
        // This is a simplified view of wealth in the context of the chamas
        const totalWealth = totalContributions;

        setStats({
          totalChamas: (chamasData || []).length,
          totalWealth: `KES ${totalWealth.toLocaleString()}`,
          contributionsMade: contributionsCount,
          proposalsVoted: votesCount || 0,
          activeLoans: activeLoansCount
        });

        // Format Chamas data for display
        const formattedChamas = (chamasData || []).map(chama => ({
          chama_id: chama.chama_id,
          id: chama.chama_id, // Keep both for backward compatibility
          name: chama.name,
          members: chama.members_count || 1,
          potSize: `KES ${(chama.total_treasury_balance || 0).toLocaleString()}`,
          nextPayout: "Pending", // Placeholder
          nextRecipient: "TBD", // Placeholder
          status: "Active",
          role: "Admin", // Since we fetched by creator
          country: "Kenya", // Placeholder
          flag: "🇰🇪",
          description: chama.description
        }))

        setChamas(formattedChamas)

        // Fetch Proposals for these chamas
        if (chamasData && chamasData.length > 0) {
          const chamaIds = chamasData.map(c => c.chama_id)
          const { data: proposalsData, error: proposalsError } = await supabase
            .from('proposals')
            .select('*')
            .in('chama_id', chamaIds)
            .eq('status', 'Active') // Only fetch active proposals for the summary
            .order('created_at', { ascending: false })

          if (proposalsError) throw proposalsError
          setProposals(proposalsData || [])
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setIsLoadingData(false)
      }
    }

    fetchData()
  }, [address, user]);

  return (
    <div className="min-h-screen bg-background mb-5">
      {/* Header */}


      <div className="container mx-auto px-4 mt-16 pb-12">
        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <StatsCard
            title="Total Chamas"
            value={stats.totalChamas.toString()}
            icon={<Users className="w-5 h-5" />}
          />
          <StatsCard
            title="Total Contributed"
            value={stats.totalWealth}
            icon={<TrendingUp className="w-5 h-5" />}
          />
          <StatsCard
            title="Contributions Made"
            value={stats.contributionsMade.toString()}
            icon={<CheckCircle2 className="w-5 h-5" />}
          />
          <StatsCard
            title="Proposals Voted"
            value={stats.proposalsVoted.toString()}
            icon={<Crown className="w-5 h-5" />}
          />
          <StatsCard
            title="Active Loans"
            value={stats.activeLoans.toString()}
            icon={<Wallet className="w-5 h-5" />}
            onClick={() => router.push("/dashboard/loans")}
            className="cursor-pointer hover:border-[var(--kente-orange)] transition-colors"
          />
        </div>

        {/* Pending Invitations */}
        <InvitationsList />

        {/* Draft Chamas */}
        <DraftChamasList />

        {/* Active Proposals Summary */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Active Proposals</CardTitle>
                <CardDescription>Proposals requiring your vote across all Chamas</CardDescription>
              </div>
              <Badge variant="secondary">{proposals.length} pending</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {proposals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No active proposals found.
              </div>
            ) : (
              proposals.map((proposal) => (
                <ProposalListItem
                  key={proposal.proposal_id}
                  chamaName={chamas.find(c => c.chama_id === proposal.chama_id)?.name || "Unknown Chama"}
                  proposalId={proposal.on_chain_proposal_id || "1"}
                  title={proposal.title}
                  votesFor={0} // Need to fetch votes
                  votesAgainst={0}
                  votesAbstain={0}
                  endDate={new Date(proposal.created_at).toLocaleDateString()} // Placeholder for end date
                  userVoted={null}
                  onClick={() => router.push(`/proposal/${proposal.proposal_id}`)}
                />
              ))
            )}
          </CardContent>
        </Card>



        {/* My Chamas Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-heading font-bold">My Chamas</h2>
              <p className="text-muted-foreground">Groups you're actively participating in</p>
            </div>
            <Button
              className="gap-2"
              onClick={() => router.push("/chama/create")}
            >
              <Plus className="w-4 h-4" />
              Create Chama
            </Button>
          </div>

          {isLoadingData ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--kente-orange)]" />
            </div>
          ) : (
            <div className="space-y-3">
              {chamas.map((chama) => (
                <div
                  key={chama.chama_id}
                  onClick={() => router.push(`/chama/${chama.chama_id}`)}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <div className="flex-1">
                    <h4 className="font-semibold">{chama.name}</h4>
                    {chama.description && (
                      <p className="text-sm text-muted-foreground mt-1">{chama.description}</p>
                    )}
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Empty State for New Users */}
        {!isLoadingData && chamas.length === 0 && (
          <Card className="mt-8">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-muted mb-4 flex items-center justify-center">
                <Users className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No Chamas Yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                You haven't joined any Chamas yet. Create your own or join an existing one to start saving together.
              </p>
              <div className="flex gap-3">
                <Button onClick={() => router.push("/chama/create")} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Create Chama
                </Button>
                <Button variant="outline" onClick={() => router.push("/")}>
                  Explore Chamas
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function StatsCard({ title, value, icon, onClick, className }: { title: string; value: string; icon: React.ReactNode; onClick?: () => void; className?: string }) {
  return (
    <Card className={`smooth-hover ${className}`} onClick={onClick}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="text-[var(--kente-orange)]">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  )
}

function ProposalListItem({
  chamaName,
  proposalId,
  title,
  votesFor,
  votesAgainst,
  votesAbstain,
  endDate,
  userVoted,
  onClick
}: {
  chamaName: string
  proposalId: string
  title: string
  votesFor: number
  votesAgainst: number
  votesAbstain: number
  endDate: string
  userVoted: string | null
  onClick: () => void
}) {
  return (
    <div className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" onClick={onClick}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="outline" className="font-mono text-xs">{proposalId}</Badge>
          <span className="text-xs text-muted-foreground">{chamaName}</span>
          {userVoted && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
              ✓ Voted {userVoted}
            </Badge>
          )}
        </div>
        <p className="font-semibold truncate">{title}</p>
        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {endDate}
          </span>
          <span className="text-green-600">{votesFor}% For</span>
          <span className="text-red-600">{votesAgainst}% Against</span>
          <span className="text-gray-600">{votesAbstain}% Abstain</span>
        </div>
      </div>

    </div>
  )
}

function ChamaCard({ chama, onClick }: { chama: any, onClick: () => void }) {
  const patternColors = {
    "Member": "from-[var(--ankara-teal)]/20 to-[var(--ankara-teal)]/5",
    "Admin": "from-[var(--kente-orange)]/20 to-[var(--kente-orange)]/5"
  }

  return (
    <Card
      className="smooth-hover cursor-pointer overflow-hidden group"
      onClick={onClick}
    >
      <div className={`h-2 bg-gradient-to-r ${patternColors[chama.role as keyof typeof patternColors]}`} />
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2 group-hover:text-[var(--kente-orange)] transition-colors">
              {chama.name}
            </CardTitle>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{chama.flag}</span>
              <Badge variant={chama.role === "Admin" ? "default" : "secondary"}>
                {chama.role}
              </Badge>
              <Badge variant="outline">{chama.status}</Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-muted-foreground">Total Pot</p>
            <p className="font-semibold text-[var(--kente-orange)]">{chama.potSize}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Members</p>
            <p className="font-semibold">{chama.members}</p>
          </div>
        </div>

        <div className="pt-3 border-t space-y-1">
          <p className="text-xs text-muted-foreground">Next Payout</p>
          <p className="text-sm font-semibold">{chama.nextPayout}</p>
          <p className="text-sm text-[var(--ankara-teal)] flex items-center gap-1">
            <Crown className="w-3 h-3" />
            <span>{chama.nextRecipient}</span>
          </p>
        </div>

        <Button variant="ghost" className="w-full gap-2 group-hover:bg-muted">
          View Details
          <ArrowRight className="w-4 h-4" />
        </Button>
      </CardContent>
    </Card>
  )
}

function ActivityItem({ icon, title, description, chama, time }: {
  icon: React.ReactNode
  title: string
  description: string
  chama: string
  time: string
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{title}</p>
        <p className="text-sm text-muted-foreground truncate">{description}</p>
        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
          <span>{chama}</span>
          <span>•</span>
          <span>{time}</span>
        </div>
      </div>
    </div>
  )
}

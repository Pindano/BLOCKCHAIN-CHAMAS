"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useUser } from "@/lib/UserContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Users,
  TrendingUp,
  Calendar,
  CheckCircle2,
  Crown,
  Vote,
  Coins,
  FileText,
  Activity,
  BookOpen,
  Plus,
  ArrowLeft,
  Search,
  Filter,
  DollarSign,
  Wallet,
  Info
} from "lucide-react"

// Real data fetching for Chama page
import { supabase } from "@/lib/supabase";


export default function ChamaPage() {
  const params = useParams()
  const router = useRouter()
  const chamaId = params?.id as string
  const [chama, setChama] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { address, user } = useUser()

  useEffect(() => {
    if (!address || !user) return;
    const fetchChama = async () => {
      try {
        // 1. Fetch Chama Details
        const { data: chamaData, error } = await supabase
          .from('chamas')
          .select('*')
          .eq('chama_id', chamaId)
          .single();
        if (error) throw error;

        // 2. Fetch Stats in parallel
        const [loansRes, proposalsRes, membersRes, userMemberRes, contributionsRes] = await Promise.all([
          supabase.from('loans').select('outstanding_balance').eq('chama_id', chamaId).eq('status', 'active'),
          supabase.from('proposals').select('proposal_id', { count: 'exact', head: true }).eq('chama_id', chamaId),
          supabase.from('chama_members').select('user_id', { count: 'exact', head: true }).eq('chama_id', chamaId),
          supabase.from('chama_members').select('role').eq('chama_id', chamaId).eq('user_id', user.user_id).single(),
          supabase.from('contributions').select('amount').eq('chama_id', chamaId)
        ]);

        const totalLoansAmount = loansRes.data?.reduce((sum, loan) => sum + (loan.outstanding_balance || 0), 0) || 0;
        const totalContributions = contributionsRes.data?.reduce((sum, c) => sum + Number(c.amount || 0), 0) || 0;

        const formatted = {
          name: chamaData.name,
          description: chamaData.description,
          members: membersRes.count || 0,
          potSize: `KES ${totalContributions.toLocaleString()}`,
          loansDisbursed: `KES ${totalLoansAmount.toLocaleString()}`,
          proposalCount: proposalsRes.count || 0,
          role: userMemberRes.data?.role || "Member",
        };
        setChama(formatted);
      } catch (e) {
        console.error("Error fetching chama data:", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchChama();
  }, [address, user, chamaId]);

  const [activeTab, setActiveTab] = useState("proposals");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-lg text-muted-foreground">Loading Chama details...</p>
      </div>
    );
  }

  if (!chama) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-lg text-destructive">Chama not found or an error occurred.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Kitenge Pattern Header */}
      <div className="kitenge-pattern-header relative h-48 md:h-64 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/80" />
        <div className="relative container mx-auto px-4 h-full flex flex-col justify-between py-6">
          <Button
            variant="ghost"
            className="self-start text-white hover:bg-white/20 gap-2"
            onClick={() => router.push("/dashboard")}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
          <div className="space-y-2">
            <h1 className="text-3xl md:text-5xl font-heading font-bold text-white drop-shadow-lg">{chama.name}</h1>
            <p className="text-white/90 text-lg drop-shadow">{chama.description}</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-8 pb-12">
        {/* Stats Cards */}
        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard
            title="Treasury Balance"
            value={chama.potSize}
            icon={<Coins className="w-5 h-5" />}
            subtitle="Available Funds"
          />
          <StatsCard
            title="Active Loans"
            value={chama.loansDisbursed}
            icon={<DollarSign className="w-5 h-5" />}
            subtitle="Total Disbursed"
          />
          <StatsCard
            title="Proposals"
            value={chama.proposalCount.toString()}
            icon={<Vote className="w-5 h-5" />}
            subtitle="Total Proposals"
          />
          <StatsCard
            title="Members"
            value={chama.members.toString()}
            icon={<Users className="w-5 h-5" />}
            subtitle="Active Members"
          />
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 h-auto">
            <TabsTrigger value="proposals" className="gap-2 relative">
              <Vote className="w-4 h-4" />
              <span className="hidden sm:inline">Proposals</span>
            </TabsTrigger>
            <TabsTrigger value="loans" className="gap-2">
              <DollarSign className="w-4 h-4" />
              <span className="hidden sm:inline">Loans</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-2">
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline">Activity</span>
            </TabsTrigger>
            <TabsTrigger value="info" className="gap-2">
              <Info className="w-4 h-4" />
              <span className="hidden sm:inline">Info</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="proposals" className="tab-content-enter">
            <ProposalsTab chamaId={chamaId} />
          </TabsContent>

          <TabsContent value="loans" className="tab-content-enter">
            <LoansTab chamaId={chamaId} />
          </TabsContent>

          <TabsContent value="activity" className="tab-content-enter">
            <ActivityTab chamaId={chamaId} />
          </TabsContent>

          <TabsContent value="info" className="tab-content-enter">
            <ChamaInfoTab chamaId={chamaId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function StatsCard({
  title,
  value,
  icon,
  trend,
  trendUp,
  badge,
  badgeVariant = "default",
  subtitle
}: {
  title: string
  value: string
  icon: React.ReactNode
  trend?: string
  trendUp?: boolean
  badge?: string
  badgeVariant?: "default" | "success" | "destructive" | "outline"
  subtitle?: string
}) {
  return (
    <Card className="smooth-hover">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="text-[var(--kente-orange)]">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <p className={`text-xs mt-1 flex items-center gap-1 ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
            <TrendingUp className={`w-3 h-3 ${!trendUp && 'rotate-180'}`} />
            {trend}
          </p>
        )}
        {badge && (
          <Badge variant={badgeVariant as any} className="mt-2">
            {badge}
          </Badge>
        )}
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  )
}

// Proposals tab with real data from Supabase
function ProposalsTab({ chamaId }: { chamaId: string }) {
  const router = useRouter();
  const { address, user } = useUser();
  const [proposals, setProposals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    if (!address || !user) return;

    const fetchProposals = async () => {
      try {
        const { data, error } = await supabase
          .from('proposals')
          .select('*')
          .eq('chama_id', chamaId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Fetch all votes for these proposals
        const proposalIds = (data || []).map(p => p.proposal_id);
        const { data: votesData } = await supabase
          .from('votes')
          .select('*')
          .in('proposal_id', proposalIds);

        // Transform to match UI structure
        const formattedProposals = (data || []).map(proposal => {
          // Get votes for this specific proposal
          const proposalVotes = (votesData || []).filter(v => v.proposal_id === proposal.proposal_id);

          // Calculate vote counts
          const forCount = proposalVotes.filter(v => v.support === "For" || v.support === 1).length;
          const againstCount = proposalVotes.filter(v => v.support === "Against" || v.support === 0).length;
          const abstainCount = proposalVotes.filter(v => v.support === "Abstain" || v.support === 2).length;
          const totalVotes = proposalVotes.length;

          // Check if current user has voted
          const userVote = proposalVotes.find(v =>
            v.voter?.toLowerCase() === address?.toLowerCase()
          );

          return {
            id: proposal.proposal_id,
            code: `PROP-${proposal.on_chain_proposal_id || proposal.proposal_id.slice(0, 6)}`,
            title: proposal.title,
            status: proposal.status || "Active",
            endDate: new Date(proposal.created_at).toLocaleDateString(),
            totalVotes: totalVotes,
            requiredVotes: 20, // Placeholder - would get from chama members count
            votesFor: totalVotes > 0 ? Math.round((forCount / totalVotes) * 100) : 0,
            votesAgainst: totalVotes > 0 ? Math.round((againstCount / totalVotes) * 100) : 0,
            votesAbstain: totalVotes > 0 ? Math.round((abstainCount / totalVotes) * 100) : 0,
            userVoted: userVote ? (
              userVote.support === "For" || userVote.support === 1 ? "For" :
                userVote.support === "Against" || userVote.support === 0 ? "Against" :
                  "Abstain"
            ) : null,
          };
        });

        setProposals(formattedProposals);
      } catch (e) {
        console.error("Error fetching proposals:", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProposals();
  }, [chamaId, address, user]);

  const filteredProposals = proposals.filter(proposal => {
    const matchesSearch = proposal.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "all" || proposal.status.toLowerCase() === filterStatus.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  if (isLoading) {
    return <p className="text-muted-foreground">Loading proposals...</p>;
  }

  return (
    <div className="space-y-4">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-heading font-bold">Proposals</h2>
          <p className="text-muted-foreground">Active proposals requiring your vote</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/reconciliation?chamaId=${chamaId}`)}
          >
            <Coins className="w-4 h-4 mr-2" />
            Record Contributions
          </Button>
          <Button onClick={() => router.push(`/dashboard/proposals/create?chamaId=${chamaId}`)}>
            <Plus className="w-4 h-4 mr-2" />
            New Proposal
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search proposals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filterStatus === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("all")}
          >
            All
          </Button>
          <Button
            variant={filterStatus === "active" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("active")}
          >
            Active
          </Button>
          <Button
            variant={filterStatus === "passed" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("passed")}
          >
            Passed
          </Button>
        </div>
      </div>

      {filteredProposals.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No proposals found.</p>
          </CardContent>
        </Card>
      ) : (
        filteredProposals.map((proposal) => (
          <ProposalListItem
            key={proposal.id}
            proposal={proposal}
            onClick={() => router.push(`/proposal/${proposal.id}`)}
          />
        ))
      )}
    </div>
  );
}

function ProposalListItem({ proposal, onClick }: { proposal: any; onClick: () => void }) {
  // Check if proposal is active (case-insensitive)
  const isActive = proposal.status?.toLowerCase() === "active" || proposal.status?.toLowerCase() === "pending"

  // Debug log
  console.log('Proposal:', proposal.title, 'Status:', proposal.status, 'isActive:', isActive, 'userVoted:', proposal.userVoted)

  return (
    <div
      className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors cursor-pointer keyboard-navigable mobile-stack"
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`View proposal: ${proposal.title}`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <Badge variant="outline" className="font-mono text-xs">
            {proposal.code}
          </Badge>
          <Badge variant={isActive ? "default" : "secondary"} className="text-xs">
            {proposal.status}
          </Badge>
          {proposal.userVoted && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
              ✓ Voted {proposal.userVoted}
            </Badge>
          )}
        </div>
        <p className="font-semibold truncate mb-2">{proposal.title}</p>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {proposal.endDate}
          </span>
          <span className="flex items-center gap-1 mobile-hide">
            <Vote className="w-3 h-3" />
            {proposal.totalVotes}/{proposal.requiredVotes} votes
          </span>
        </div>
      </div>
    </div>
  )
}



// Loans tab with real loan data
function LoansTab({ chamaId }: { chamaId: string }) {
  const router = useRouter();
  const { address, user } = useUser();
  const [loans, setLoans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!address || !user) return;

    const fetchLoans = async () => {
      try {
        // 1. Fetch loans without join first
        const { data: loansData, error: loansError } = await supabase
          .from('loans')
          .select('*')
          .eq('chama_id', chamaId)
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        if (loansError) throw loansError;

        if (!loansData || loansData.length === 0) {
          setLoans([]);
          return;
        }

        // 2. Fetch borrower details manually (since FK might be missing)
        const borrowerIds = Array.from(new Set(loansData.map(l => l.borrower_id)));

        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('user_id, first_name, last_name')
          .in('user_id', borrowerIds);

        if (usersError) throw usersError;

        // 3. Merge data
        const userMap = (usersData || []).reduce((acc: any, user: any) => {
          acc[user.user_id] = user;
          return acc;
        }, {});

        const loansWithUsers = loansData.map(loan => ({
          ...loan,
          users: userMap[loan.borrower_id] || { first_name: 'Unknown', last_name: 'User' }
        }));

        setLoans(loansWithUsers);
      } catch (e: any) {
        console.error("Error fetching loans:", e);
        console.error("Error details:", JSON.stringify(e, null, 2));
        if (e.message) console.error("Error message:", e.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLoans();
  }, [chamaId, address, user]);

  if (isLoading) {
    return <p className="text-muted-foreground">Loading loans...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading font-bold">Active Loans</h2>
          <p className="text-muted-foreground">Manage loans and repayments</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/loans/request?chamaId=${chamaId}`)}
          >
            <DollarSign className="w-4 h-4 mr-2" />
            Request Loan
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/loans/repayments?chamaId=${chamaId}`)}
          >
            <Wallet className="w-4 h-4 mr-2" />
            Record Repayment
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          {loans.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No active loans in this Chama.</p>
          ) : (
            <div className="space-y-4">
              {loans.map((loan) => (
                <div key={loan.loan_id} className="flex items-center justify-between border-b pb-4 last:border-0">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[var(--kente-orange)]/10 flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-[var(--kente-orange)]" />
                    </div>
                    <div>
                      <p className="font-medium">{loan.users?.first_name} {loan.users?.last_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Principal: KES {loan.amount?.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[var(--kente-orange)]">
                      KES {loan.outstanding_balance?.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">Outstanding Balance</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Chama Info Tab (Members + Constitution)
function ChamaInfoTab({ chamaId }: { chamaId: string }) {
  const { address, user } = useUser();
  const [members, setMembers] = useState<any[]>([]);
  const [constitution, setConstitution] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!address || !user) return;

    const fetchData = async () => {
      try {
        // Fetch Members
        const { data: membersData, error: membersError } = await supabase
          .from('chama_members')
          .select(`
                        *,
                        users (
                            email,
                            wallet_address
                        )
                    `)
          .eq('chama_id', chamaId)
          .order('joined_at', { ascending: true });

        if (membersError) throw membersError;
        setMembers(membersData || []);

        // Fetch Constitution
        const { data: constitutionData, error: constitutionError } = await supabase
          .from('constitutions')
          .select('content')
          .eq('chama_id', chamaId)
          .single();

        // Constitution might not exist, don't throw error
        setConstitution(constitutionData?.content || 'No constitution found.');

      } catch (e) {
        console.error("Error fetching info:", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [chamaId, address, user]);

  if (isLoading) {
    return <p className="text-muted-foreground">Loading info...</p>;
  }

  return (
    <div className="space-y-8">
      {/* Members Section */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-heading font-bold">Members</h2>
          <p className="text-muted-foreground">{members.length} active members</p>
        </div>
        <Card>
          <CardContent className="p-6">
            {members.length === 0 ? (
              <p className="text-center text-muted-foreground">No members found.</p>
            ) : (
              <div className="space-y-4">
                {members.map((member: any) => (
                  <div key={member.chama_member_id} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[var(--kente-orange)] text-white flex items-center justify-center font-bold">
                        {member.users?.wallet_address?.slice(0, 2).toUpperCase() || member.users?.email?.slice(0, 2).toUpperCase() || '??'}
                      </div>
                      <div>
                        <p className="font-medium">{member.users?.email || 'Unknown User'}</p>
                        {member.users?.wallet_address && (
                          <p className="text-xs text-muted-foreground">{member.users.wallet_address.slice(0, 10)}...{member.users.wallet_address.slice(-8)}</p>
                        )}
                        <p className="text-xs text-muted-foreground">Joined {new Date(member.joined_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
                      {member.role || 'member'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Constitution Section */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-heading font-bold">Constitution</h2>
          <p className="text-muted-foreground">Rules and guidelines</p>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: constitution }} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


// Activity tab with real activity feed
function ActivityTab({ chamaId }: { chamaId: string }) {
  const { address, user } = useUser();
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!address || !user) return;

    const fetchActivities = async () => {
      try {
        const { data, error } = await supabase
          .from('activities')
          .select('*')
          .eq('chama_id', chamaId)
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) throw error;
        setActivities(data || []);
      } catch (e) {
        console.error("Error fetching activities:", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivities();
  }, [chamaId, address, user]);

  if (isLoading) {
    return <p className="text-muted-foreground">Loading activity feed...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-heading font-bold">Activity Feed</h2>
        <p className="text-muted-foreground">Recent actions and updates</p>
      </div>
      <Card>
        <CardContent className="p-6">
          {activities.length === 0 ? (
            <p className="text-center text-muted-foreground">No recent activity.</p>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.activity_id || activity.id} className="flex gap-3 border-b pb-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{activity.title || activity.type}</p>
                    <p className="text-sm text-muted-foreground">{activity.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(activity.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}







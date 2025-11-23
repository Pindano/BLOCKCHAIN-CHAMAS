"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DollarSign, Wallet, Clock, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useUser } from "@/lib/UserContext"

export default function LoansDashboardPage() {
    const router = useRouter()
    const { user } = useUser()
    const [myLoans, setMyLoans] = useState<any[]>([])
    const [allLoans, setAllLoans] = useState<any[]>([])
    const [pendingRequests, setPendingRequests] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return

            try {
                setIsLoading(true)

                // 1. Fetch My Loans
                const { data: myLoansData } = await supabase
                    .from("loans")
                    .select(`
                        *,
                        chamas (name)
                    `)
                    .eq("borrower_id", user.user_id)
                    .order("created_at", { ascending: false })

                setMyLoans(myLoansData || [])

                // 2. Fetch All Active Loans (for transparency/admin)
                // In a real app, might want to limit this or paginate
                const { data: allLoansData } = await supabase
                    .from("loans")
                    .select(`
                        *,
                        chamas (name),
                        users (first_name, last_name)
                    `)
                    .eq("status", "active")
                    .order("created_at", { ascending: false })

                setAllLoans(allLoansData || [])

                // 3. Fetch Pending Loan Requests (Proposals)
                const { data: proposalsData } = await supabase
                    .from("proposals")
                    .select(`
                        *,
                        chamas (name),
                        users (first_name, last_name)
                    `)
                    .eq("proposal_type", "LOAN_REQUEST")
                    .eq("status", "Active")
                    .order("created_at", { ascending: false })

                setPendingRequests(proposalsData || [])

            } catch (error) {
                console.error("Error fetching loans data:", error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [user])

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background p-6 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-[var(--kente-orange)] border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading loans dashboard...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold">Loans Dashboard</h1>
                    <p className="text-muted-foreground">Manage your loans and review requests</p>
                </div>

                {/* Stats Overview */}
                <div className="grid md:grid-cols-3 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">My Active Loans</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{myLoans.filter(l => l.status === 'active').length}</div>
                            <p className="text-xs text-muted-foreground">
                                Total Balance: KES {myLoans.filter(l => l.status === 'active').reduce((sum, l) => sum + l.outstanding_balance, 0).toLocaleString()}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{pendingRequests.length}</div>
                            <p className="text-xs text-muted-foreground">Requiring approval</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Chama Loans</CardTitle>
                            <Wallet className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">KES {allLoans.reduce((sum, l) => sum + l.outstanding_balance, 0).toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">Across all chamas</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content */}
                <Tabs defaultValue="my-loans" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="my-loans">My Loans</TabsTrigger>
                        <TabsTrigger value="pending">Pending Requests</TabsTrigger>
                        <TabsTrigger value="all-loans">All Active Loans</TabsTrigger>
                    </TabsList>

                    {/* My Loans Tab */}
                    <TabsContent value="my-loans" className="space-y-4">
                        {myLoans.length === 0 ? (
                            <Card>
                                <CardContent className="py-12 text-center text-muted-foreground">
                                    You don't have any loans yet.
                                </CardContent>
                            </Card>
                        ) : (
                            myLoans.map(loan => (
                                <Card key={loan.loan_id} className="overflow-hidden">
                                    <div className={`h-1 ${loan.status === 'active' ? 'bg-[var(--kente-orange)]' : 'bg-green-500'}`} />
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-semibold text-lg">{loan.chamas?.name}</h3>
                                                    <Badge variant={loan.status === 'active' ? 'default' : 'secondary'}>
                                                        {loan.status}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground mb-4">
                                                    Disbursed on {new Date(loan.created_at).toLocaleDateString()}
                                                </p>
                                                <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                                                    <div>
                                                        <span className="text-muted-foreground">Principal:</span>
                                                        <span className="ml-2 font-medium">KES {loan.amount?.toLocaleString()}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground">Monthly Payment:</span>
                                                        <span className="ml-2 font-medium">KES {loan.monthly_payment?.toLocaleString()}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground">Interest Rate:</span>
                                                        <span className="ml-2 font-medium">{loan.interest_rate}%</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground">Term:</span>
                                                        <span className="ml-2 font-medium">{loan.repayment_period_months} months</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-muted-foreground">Outstanding Balance</p>
                                                <p className="text-2xl font-bold text-[var(--kente-orange)]">
                                                    KES {loan.outstanding_balance?.toLocaleString()}
                                                </p>
                                                {loan.status === 'active' && (
                                                    <Button
                                                        className="mt-4 gap-2"
                                                        size="sm"
                                                        onClick={() => router.push(`/dashboard/loans/repayments?chamaId=${loan.chama_id}`)}
                                                    >
                                                        <Wallet className="w-4 h-4" />
                                                        Make Repayment
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </TabsContent>

                    {/* Pending Requests Tab */}
                    <TabsContent value="pending" className="space-y-4">
                        {pendingRequests.length === 0 ? (
                            <Card>
                                <CardContent className="py-12 text-center text-muted-foreground">
                                    No pending loan requests.
                                </CardContent>
                            </Card>
                        ) : (
                            pendingRequests.map(proposal => (
                                <Card key={proposal.proposal_id} className="hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => router.push(`/proposal/${proposal.proposal_id}`)}>
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                    <Clock className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold">{proposal.title}</h3>
                                                    <p className="text-sm text-muted-foreground">
                                                        Requested by {proposal.users?.first_name} {proposal.users?.last_name} • {proposal.chamas?.name}
                                                    </p>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="sm">
                                                View Proposal <ArrowRight className="w-4 h-4 ml-2" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </TabsContent>

                    {/* All Active Loans Tab */}
                    <TabsContent value="all-loans" className="space-y-4">
                        <div className="rounded-md border">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/50">
                                        <th className="p-4 text-left font-medium">Borrower</th>
                                        <th className="p-4 text-left font-medium">Chama</th>
                                        <th className="p-4 text-left font-medium">Amount</th>
                                        <th className="p-4 text-left font-medium">Balance</th>
                                        <th className="p-4 text-left font-medium">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allLoans.map(loan => (
                                        <tr key={loan.loan_id} className="border-b last:border-0 hover:bg-muted/50">
                                            <td className="p-4 font-medium">{loan.users?.first_name} {loan.users?.last_name}</td>
                                            <td className="p-4 text-muted-foreground">{loan.chamas?.name}</td>
                                            <td className="p-4">KES {loan.amount?.toLocaleString()}</td>
                                            <td className="p-4 font-bold text-[var(--kente-orange)]">KES {loan.outstanding_balance?.toLocaleString()}</td>
                                            <td className="p-4">
                                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                    Active
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}

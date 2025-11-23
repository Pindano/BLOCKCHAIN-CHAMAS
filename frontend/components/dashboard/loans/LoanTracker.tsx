// components/dashboard/loans/LoanTracker.tsx
"use client"

import { useState, useEffect } from "react"
import { getSupabaseClient } from "@/lib/supabase-client"
import type { Loan } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Wallet, Download } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"

interface LoanWithBorrower extends Loan {
    users?: { first_name: string; last_name: string }
}

export function LoanTracker({ chamaId }: { chamaId: string }) {
    const [loans, setLoans] = useState<LoanWithBorrower[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'active' | 'repaid'>('all')

    const supabase = getSupabaseClient()

    useEffect(() => {
        fetchLoans()
    }, [chamaId, filter])

    const fetchLoans = async () => {
        setLoading(true)

        let query = supabase
            .from("loans")
            .select("*, users(first_name, last_name)")
            .eq("chama_id", chamaId)
            .order("created_at", { ascending: false })

        if (filter !== 'all') {
            query = query.eq("status", filter)
        }

        const { data, error } = await query

        if (!error && data) {
            setLoans(data as LoanWithBorrower[])
        }
        setLoading(false)
    }

    const getStatusBadge = (status: string) => {
        const badges: Record<string, { variant: any; label: string }> = {
            pending: { variant: "outline", label: "Pending Approval" },
            approved: { variant: "secondary", label: "Approved" },
            active: { variant: "default", label: "Active" },
            repaid: { variant: "default", label: "✓ Repaid" },
        }
        const config = badges[status] || { variant: "outline", label: status }
        return <Badge variant={config.variant} className={status === 'repaid' ? 'bg-green-600' : ''}>{config.label}</Badge>
    }

    const totalLoaned = loans.reduce((sum, l) => sum + Number(l.amount), 0)
    const activeLoans = loans.filter(l => l.status === 'active').length
    const totalRepaid = loans.reduce((sum, l) => sum + Number(l.amount_repaid), 0)

    const exportToCSV = () => {
        const headers = ['Borrower', 'Amount', 'Purpose', 'Status', 'Monthly Payment', 'Amount Repaid', 'Created']
        const rows = loans.map(l => [
            `${l.users?.first_name} ${l.users?.last_name}`,
            l.amount,
            l.purpose,
            l.status,
            l.monthly_payment || 0,
            l.amount_repaid,
            format(new Date(l.created_at), 'yyyy-MM-dd')
        ])

        const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `loans-${chamaId}-${Date.now()}.csv`
        link.click()
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Wallet className="w-5 h-5" />
                            Loan Management
                        </CardTitle>
                        <CardDescription>Track all Chama loans and repayments</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={exportToCSV} className="gap-2">
                        <Download className="w-4 h-4" />
                        Export
                    </Button>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="p-3 rounded-lg border bg-muted/50">
                        <p className="text-xs text-muted-foreground">Total Loaned</p>
                        <p className="text-lg font-bold">KES {totalLoaned.toLocaleString()}</p>
                    </div>
                    <div className="p-3 rounded-lg border bg-blue-50 dark:bg-blue-950/20">
                        <p className="text-xs text-muted-foreground">Active Loans</p>
                        <p className="text-lg font-bold text-blue-700 dark:text-blue-400">{activeLoans}</p>
                    </div>
                    <div className="p-3 rounded-lg border bg-green-50 dark:bg-green-950/20">
                        <p className="text-xs text-muted-foreground">Total Repaid</p>
                        <p className="text-lg font-bold text-green-700 dark:text-green-400">KES {totalRepaid.toLocaleString()}</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex gap-2 mt-4">
                    <Button size="sm" variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')}>
                        All
                    </Button>
                    <Button size="sm" variant={filter === 'pending' ? 'default' : 'outline'} onClick={() => setFilter('pending')}>
                        Pending
                    </Button>
                    <Button size="sm" variant={filter === 'approved' ? 'default' : 'outline'} onClick={() => setFilter('approved')}>
                        Approved
                    </Button>
                    <Button size="sm" variant={filter === 'active' ? 'default' : 'outline'} onClick={() => setFilter('active')}>
                        Active
                    </Button>
                    <Button size="sm" variant={filter === 'repaid' ? 'default' : 'outline'} onClick={() => setFilter('repaid')}>
                        Repaid
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <p className="text-sm text-muted-foreground text-center py-8">Loading loans...</p>
                ) : loans.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No loans found</p>
                ) : (
                    <div className="space-y-4">
                        {loans.map((loan) => {
                            const totalAmount = Number(loan.amount) * (1 + Number(loan.interest_rate) / 100)
                            const repaymentProgress = totalAmount > 0 ? (Number(loan.amount_repaid) / totalAmount) * 100 : 0

                            return (
                                <Link key={loan.loan_id} href={`/dashboard/loans/${loan.loan_id}`}>
                                    <div className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <p className="font-medium">{loan.users?.first_name} {loan.users?.last_name}</p>
                                                <p className="text-sm text-muted-foreground line-clamp-1">{loan.purpose}</p>
                                            </div>
                                            {getStatusBadge(loan.status)}
                                        </div>

                                        <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                                            <div>
                                                <p className="text-muted-foreground">Amount</p>
                                                <p className="font-medium">KES {Number(loan.amount).toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground">Monthly Payment</p>
                                                <p className="font-medium">KES {Number(loan.monthly_payment || 0).toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground">Repaid</p>
                                                <p className="font-medium">KES {Number(loan.amount_repaid).toLocaleString()}</p>
                                            </div>
                                        </div>

                                        {loan.status === 'active' && (
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-xs text-muted-foreground">
                                                    <span>Repayment Progress</span>
                                                    <span>{repaymentProgress.toFixed(1)}%</span>
                                                </div>
                                                <Progress value={repaymentProgress} className="h-2" />
                                            </div>
                                        )}
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

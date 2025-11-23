// components/dashboard/contributions/ContributionTracker.tsx
"use client"

import { useState, useEffect } from "react"
import { getSupabaseClient } from "@/lib/supabase-client"
import type { Contribution } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Clock, AlertCircle, Download } from "lucide-react"
import { format } from "date-fns"
import { LiveReconciliationEditor } from "./LiveReconciliationEditor"

interface ContributionWithMember extends Contribution {
    users?: { first_name: string; last_name: string }
}

export function ContributionTracker({ chamaId }: { chamaId: string }) {
    const [contributions, setContributions] = useState<ContributionWithMember[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<'all' | 'verified' | 'reconciled' | 'pending'>('all')

    const supabase = getSupabaseClient()

    useEffect(() => {
        fetchContributions()
    }, [chamaId, filter])

    const fetchContributions = async () => {
        setLoading(true)

        let query = supabase
            .from("contributions")
            .select("*, users(first_name, last_name)")
            .eq("chama_id", chamaId)
            .order("contribution_date", { ascending: false })

        if (filter !== 'all') {
            query = query.eq("status", filter)
        }

        const { data, error } = await query

        if (!error && data) {
            setContributions(data as ContributionWithMember[])
        }
        setLoading(false)
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'verified':
                return <Badge className="gap-1 bg-green-600"><CheckCircle2 className="w-3 h-3" /> Verified</Badge>
            case 'reconciled':
                return <Badge className="gap-1 bg-blue-600"><Clock className="w-3 h-3" /> Reconciled</Badge>
            case 'pending':
                return <Badge variant="outline" className="gap-1"><AlertCircle className="w-3 h-3" /> Pending</Badge>
            default:
                return <Badge variant="secondary">{status}</Badge>
        }
    }

    const totalAmount = contributions.reduce((sum, c) => sum + Number(c.amount), 0)
    const verifiedAmount = contributions.filter(c => c.status === 'verified').reduce((sum, c) => sum + Number(c.amount), 0)

    const exportToCSV = () => {
        const headers = ['Date', 'Member', 'Amount', 'Status', 'Reference', 'Payment Method']
        const rows = contributions.map(c => [
            format(new Date(c.contribution_date), 'yyyy-MM-dd'),
            `${c.users?.first_name} ${c.users?.last_name}`,
            c.amount,
            c.status,
            c.reference || '',
            c.payment_method || ''
        ])

        const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `contributions-${chamaId}-${Date.now()}.csv`
        link.click()
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Contribution History</CardTitle>
                        <CardDescription>Track all member contributions</CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <LiveReconciliationEditor chamaId={chamaId} />
                        <Button variant="outline" size="sm" onClick={exportToCSV} className="gap-2">
                            <Download className="w-4 h-4" />
                            Export
                        </Button>
                    </div>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="p-3 rounded-lg border bg-muted/50">
                        <p className="text-xs text-muted-foreground">Total Contributions</p>
                        <p className="text-lg font-bold">KES {totalAmount.toLocaleString()}</p>
                    </div>
                    <div className="p-3 rounded-lg border bg-green-50 dark:bg-green-950/20">
                        <p className="text-xs text-muted-foreground">Verified Amount</p>
                        <p className="text-lg font-bold text-green-700 dark:text-green-400">KES {verifiedAmount.toLocaleString()}</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex gap-2 mt-4">
                    <Button size="sm" variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')}>
                        All
                    </Button>
                    <Button size="sm" variant={filter === 'verified' ? 'default' : 'outline'} onClick={() => setFilter('verified')}>
                        Verified
                    </Button>
                    <Button size="sm" variant={filter === 'reconciled' ? 'default' : 'outline'} onClick={() => setFilter('reconciled')}>
                        Reconciled
                    </Button>
                    <Button size="sm" variant={filter === 'pending' ? 'default' : 'outline'} onClick={() => setFilter('pending')}>
                        Pending
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <p className="text-sm text-muted-foreground text-center py-8">Loading contributions...</p>
                ) : contributions.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No contributions found</p>
                ) : (
                    <div className="rounded-md border">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/50">
                                    <th className="p-3 text-left font-medium">Date</th>
                                    <th className="p-3 text-left font-medium">Member</th>
                                    <th className="p-3 text-right font-medium">Amount</th>
                                    <th className="p-3 text-left font-medium">Status</th>
                                    <th className="p-3 text-left font-medium">Reference</th>
                                </tr>
                            </thead>
                            <tbody>
                                {contributions.map((contribution) => (
                                    <tr key={contribution.contribution_id} className="border-b last:border-0 hover:bg-muted/50">
                                        <td className="p-3">{format(new Date(contribution.contribution_date), 'MMM d, yyyy')}</td>
                                        <td className="p-3">{contribution.users?.first_name} {contribution.users?.last_name}</td>
                                        <td className="p-3 text-right font-medium">KES {Number(contribution.amount).toLocaleString()}</td>
                                        <td className="p-3">{getStatusBadge(contribution.status)}</td>
                                        <td className="p-3 text-muted-foreground">{contribution.reference || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

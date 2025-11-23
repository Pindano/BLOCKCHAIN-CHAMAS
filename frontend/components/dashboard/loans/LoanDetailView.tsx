// components/dashboard/loans/LoanDetailView.tsx
"use client"

import { useEffect, useState } from "react"
import { getSupabaseClient } from "@/lib/supabase-client"
import { useRouter } from "next/navigation"
import type { Loan } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, FileText, Download } from "lucide-react"
import { format } from "date-fns"
import { AddRepaymentForm } from "./AddRepaymentForm"
import Link from "next/link"

interface LoanWithDetails extends Loan {
    users?: { first_name: string; last_name: string; email: string }
    chamas?: { name: string }
    loan_repayments?: Array<{
        repayment_id: string
        amount: number
        payment_date: string
        reference: string | null
        payment_method: string | null
        created_at: string
    }>
}

export function LoanDetailView({ loanId }: { loanId: string }) {
    const router = useRouter()
    const [loan, setLoan] = useState<LoanWithDetails | null>(null)
    const [loading, setLoading] = useState(true)

    const supabase = getSupabaseClient()

    useEffect(() => {
        fetchLoanDetails()
    }, [loanId])

    const fetchLoanDetails = async () => {
        setLoading(true)

        const { data, error } = await supabase
            .from("loans")
            .select(`
        *,
        users(first_name, last_name, email),
        chamas(name),
        loan_repayments(*)
      `)
            .eq("loan_id", loanId)
            .single()

        if (!error && data) {
            setLoan(data as LoanWithDetails)
        }
        setLoading(false)
    }

    if (loading) {
        return <div className="text-center py-12 text-muted-foreground">Loading loan details...</div>
    }

    if (!loan) {
        return <div className="text-center py-12 text-destructive">Loan not found.</div>
    }

    const totalAmount = Number(loan.amount) * (1 + Number(loan.interest_rate) / 100)
    const remaining = totalAmount - Number(loan.amount_repaid)
    const repaymentProgress = totalAmount > 0 ? (Number(loan.amount_repaid) / totalAmount) * 100 : 0

    const getStatusBadge = (status: string) => {
        const badges: Record<string, { variant: any; label: string; className?: string }> = {
            pending: { variant: "outline", label: "Pending Approval" },
            approved: { variant: "secondary", label: "Approved" },
            active: { variant: "default", label: "Active" },
            repaid: { variant: "default", label: "✓ Fully Repaid", className: "bg-green-600" },
        }
        const config = badges[status] || { variant: "outline", label: status }
        return <Badge variant={config.variant} className={config.className}>{config.label}</Badge>
    }

    return (
        <div className="space-y-6">
            {/* Back Button */}
            <Button variant="ghost" onClick={() => router.back()} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
            </Button>

            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        {getStatusBadge(loan.status)}
                    </div>
                    <h1 className="text-3xl font-bold">Loan Details</h1>
                    <p className="text-muted-foreground mt-1">{loan.chamas?.name}</p>
                </div>
                {loan.status === 'active' && <AddRepaymentForm loanId={loanId} />}
            </div>

            {/* Loan Summary */}
            <Card>
                <CardHeader>
                    <CardTitle>Loan Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <p className="text-sm text-muted-foreground">Borrower</p>
                            <p className="font-medium">{loan.users?.first_name} {loan.users?.last_name}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Loan Amount</p>
                            <p className="font-medium">KES {Number(loan.amount).toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Interest Rate</p>
                            <p className="font-medium">{Number(loan.interest_rate)}%</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Total to Repay</p>
                            <p className="font-medium">KES {totalAmount.toLocaleString()}</p>
                        </div>
                    </div>

                    <div>
                        <p className="text-sm text-muted-foreground mb-2">Purpose</p>
                        <p className="whitespace-pre-wrap">{loan.purpose}</p>
                    </div>

                    {loan.status === 'active' && (
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Repayment Progress</span>
                                <span className="font-medium">
                                    KES {Number(loan.amount_repaid).toLocaleString()} / KES {totalAmount.toLocaleString()}
                                </span>
                            </div>
                            <Progress value={repaymentProgress} className="h-3" />
                            <p className="text-sm text-muted-foreground">
                                Remaining: KES {remaining.toLocaleString()}
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Repayment Schedule */}
            <Card>
                <CardHeader>
                    <CardTitle>Repayment Schedule</CardTitle>
                    <CardDescription>
                        {loan.repayment_period_months} months • KES {Number(loan.monthly_payment).toLocaleString()}/month
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/50">
                                    <th className="p-3 text-left font-medium">Month</th>
                                    <th className="p-3 text-right font-medium">Payment Due</th>
                                    <th className="p-3 text-right font-medium">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Array.from({ length: loan.repayment_period_months || 0 }).map((_, index) => {
                                    const monthlyPayment = Number(loan.monthly_payment)
                                    const paidSoFar = Number(loan.amount_repaid)
                                    const isPaid = paidSoFar >= monthlyPayment * (index + 1)

                                    return (
                                        <tr key={index} className="border-b last:border-0">
                                            <td className="p-3">Month {index + 1}</td>
                                            <td className="p-3 text-right font-medium">KES {monthlyPayment.toLocaleString()}</td>
                                            <td className="p-3 text-right">
                                                {isPaid ? (
                                                    <Badge className="bg-green-600">✓ Paid</Badge>
                                                ) : (
                                                    <Badge variant="outline">Pending</Badge>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Payment History */}
            {loan.loan_repayments && loan.loan_repayments.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Payment History</CardTitle>
                        <CardDescription>{loan.loan_repayments.length} payments recorded</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/50">
                                        <th className="p-3 text-left font-medium">Date</th>
                                        <th className="p-3 text-right font-medium">Amount</th>
                                        <th className="p-3 text-left font-medium">Reference</th>
                                        <th className="p-3 text-left font-medium">Method</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loan.loan_repayments
                                        .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())
                                        .map((repayment) => (
                                            <tr key={repayment.repayment_id} className="border-b last:border-0">
                                                <td className="p-3">{format(new Date(repayment.payment_date), 'MMM d, yyyy')}</td>
                                                <td className="p-3 text-right font-medium">KES {Number(repayment.amount).toLocaleString()}</td>
                                                <td className="p-3 text-muted-foreground">{repayment.reference || '-'}</td>
                                                <td className="p-3 text-muted-foreground">{repayment.payment_method || '-'}</td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Linked Proposal */}
            {loan.proposal_id && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Linked Proposal
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Link href={`/dashboard/proposals/${loan.proposal_id}`}>
                            <Button variant="outline">View Approval Proposal</Button>
                        </Link>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

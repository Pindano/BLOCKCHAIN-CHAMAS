// components/dashboard/loans/RequestLoanModal.tsx
"use client"

import { useState } from "react"
import { useUser } from "@/lib/UserContext"
import { getSupabaseClient } from "@/lib/supabase-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Wallet } from "lucide-react"
import { toast } from "sonner"
import { createLoanRequest } from "@/app/actions/loans"

export function RequestLoanModal() {
    const { user } = useUser()
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [chamas, setChamas] = useState<any[]>([])
    const [formData, setFormData] = useState({
        chama_id: "",
        amount: "",
        purpose: "",
        repayment_period_months: "12",
        interest_rate: "0"
    })

    const supabase = getSupabaseClient()

    const handleOpenChange = async (isOpen: boolean) => {
        setOpen(isOpen)
        if (isOpen && user) {
            const { data } = await supabase
                .from("chama_members")
                .select("chama_id, chamas(chama_id, name)")
                .eq("user_id", user.user_id)

            if (data) {
                setChamas(data.map((m: any) => m.chamas).filter(Boolean))
            }
        }
    }

    const monthlyPayment = formData.amount && formData.repayment_period_months
        ? (Number(formData.amount) * (1 + Number(formData.interest_rate) / 100)) / Number(formData.repayment_period_months)
        : 0

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) {
            toast.error("You must be logged in")
            return
        }

        if (!formData.chama_id || !formData.amount || !formData.purpose) {
            toast.error("Please fill in all required fields")
            return
        }

        setLoading(true)

        try {
            const result = await createLoanRequest(
                formData.chama_id,
                user.user_id,
                Number(formData.amount),
                formData.purpose,
                Number(formData.repayment_period_months),
                Number(formData.interest_rate)
            )

            toast.success("Loan request submitted! A proposal has been created for member approval.")
            setFormData({
                chama_id: "",
                amount: "",
                purpose: "",
                repayment_period_months: "12",
                interest_rate: "0"
            })
            setOpen(false)

            // Redirect to proposal page
            window.location.href = `/dashboard/proposals/${result.proposalId}`
        } catch (err: any) {
            console.error("Unexpected error:", err)
            toast.error(err.message || "An unexpected error occurred")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Wallet className="w-4 h-4" />
                    Request Loan
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Request a Loan</DialogTitle>
                    <DialogDescription>
                        Submit a loan request for your Chama members to approve
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="chama_id">Chama *</Label>
                        <Select
                            value={formData.chama_id}
                            onValueChange={(value) => setFormData({ ...formData, chama_id: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a Chama" />
                            </SelectTrigger>
                            <SelectContent>
                                {chamas.map((chama) => (
                                    <SelectItem key={chama.chama_id} value={chama.chama_id}>
                                        {chama.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="amount">Loan Amount (KES) *</Label>
                            <Input
                                id="amount"
                                type="number"
                                step="100"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                placeholder="50000"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="repayment_period_months">Repayment Period (months) *</Label>
                            <Select
                                value={formData.repayment_period_months}
                                onValueChange={(value) => setFormData({ ...formData, repayment_period_months: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="3">3 months</SelectItem>
                                    <SelectItem value="6">6 months</SelectItem>
                                    <SelectItem value="12">12 months</SelectItem>
                                    <SelectItem value="18">18 months</SelectItem>
                                    <SelectItem value="24">24 months</SelectItem>
                                    <SelectItem value="36">36 months</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="interest_rate">Interest Rate (%) *</Label>
                        <Input
                            id="interest_rate"
                            type="number"
                            step="0.1"
                            value={formData.interest_rate}
                            onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value })}
                            placeholder="0"
                        />
                        <p className="text-xs text-muted-foreground">Default is 0% (interest-free)</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="purpose">Purpose *</Label>
                        <Textarea
                            id="purpose"
                            value={formData.purpose}
                            onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                            placeholder="Describe why you need this loan..."
                            rows={4}
                            required
                        />
                    </div>

                    {monthlyPayment > 0 && (
                        <div className="p-4 rounded-lg bg-muted">
                            <p className="text-sm font-medium mb-2">Loan Summary</p>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                    <p className="text-muted-foreground">Monthly Payment:</p>
                                    <p className="font-bold">KES {monthlyPayment.toFixed(2)}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Total Repayment:</p>
                                    <p className="font-bold">
                                        KES {(Number(formData.amount) * (1 + Number(formData.interest_rate) / 100)).toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-2 justify-end pt-4">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Submitting..." : "Submit Request"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}

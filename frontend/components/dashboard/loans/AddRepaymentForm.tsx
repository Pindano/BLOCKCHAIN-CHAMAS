// components/dashboard/loans/AddRepaymentForm.tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { addRepayment } from "@/app/actions/loans"

export function AddRepaymentForm({ loanId }: { loanId: string }) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        amount: "",
        payment_date: new Date().toISOString().split('T')[0],
        reference: "",
        payment_method: ""
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.amount) {
            toast.error("Please enter an amount")
            return
        }

        setLoading(true)

        try {
            await addRepayment(
                loanId,
                Number(formData.amount),
                formData.payment_date,
                formData.reference || undefined,
                formData.payment_method || undefined
            )

            toast.success("Repayment recorded successfully!")
            setFormData({
                amount: "",
                payment_date: new Date().toISOString().split('T')[0],
                reference: "",
                payment_method: ""
            })
            setOpen(false)

            // Refresh the page to show updated loan
            setTimeout(() => window.location.reload(), 500)
        } catch (err: any) {
            console.error("Unexpected error:", err)
            toast.error(err.message || "An unexpected error occurred")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Repayment
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Record Loan Repayment</DialogTitle>
                    <DialogDescription>
                        Add a repayment transaction for this loan
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="amount">Amount (KES) *</Label>
                        <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            placeholder="0.00"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="payment_date">Payment Date *</Label>
                        <Input
                            id="payment_date"
                            type="date"
                            value={formData.payment_date}
                            onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="reference">Reference</Label>
                        <Input
                            id="reference"
                            value={formData.reference}
                            onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                            placeholder="Transaction ID, receipt number, etc."
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="payment_method">Payment Method</Label>
                        <Input
                            id="payment_method"
                            value={formData.payment_method}
                            onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                            placeholder="M-Pesa, Bank Transfer, Cash, etc."
                        />
                    </div>

                    <div className="flex gap-2 justify-end">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Recording..." : "Record Repayment"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}

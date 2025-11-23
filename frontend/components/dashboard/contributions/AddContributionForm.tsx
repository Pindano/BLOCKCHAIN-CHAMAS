// components/dashboard/contributions/AddContributionForm.tsx
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
import { Plus } from "lucide-react"
import { toast } from "sonner"

export function AddContributionForm({ chamaId }: { chamaId: string }) {
    const { user } = useUser()
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        member_id: "",
        amount: "",
        contribution_date: new Date().toISOString().split('T')[0],
        reference: "",
        payment_method: "",
        notes: ""
    })

    const supabase = getSupabaseClient()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) {
            toast.error("You must be logged in")
            return
        }

        if (!formData.member_id || !formData.amount) {
            toast.error("Please fill in required fields")
            return
        }

        setLoading(true)

        try {
            const { error } = await supabase.from("contributions").insert({
                chama_id: chamaId,
                member_id: formData.member_id,
                amount: parseFloat(formData.amount),
                contribution_date: formData.contribution_date,
                reference: formData.reference || null,
                payment_method: formData.payment_method || null,
                notes: formData.notes || null,
                status: "pending",
                created_by: user.user_id
            })

            if (error) {
                console.error("Contribution error:", error)
                toast.error(`Failed to add contribution: ${error.message}`)
            } else {
                toast.success("Contribution added successfully!")
                setFormData({
                    member_id: "",
                    amount: "",
                    contribution_date: new Date().toISOString().split('T')[0],
                    reference: "",
                    payment_method: "",
                    notes: ""
                })
                setOpen(false)
                window.location.reload() // Refresh to show new contribution
            }
        } catch (err) {
            console.error("Unexpected error:", err)
            toast.error("An unexpected error occurred")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Contribution
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Add Contribution Record</DialogTitle>
                    <DialogDescription>
                        Record a member's contribution. This will be pending until reconciled via proposal.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="member_id">Member ID *</Label>
                        <Input
                            id="member_id"
                            value={formData.member_id}
                            onChange={(e) => setFormData({ ...formData, member_id: e.target.value })}
                            placeholder="Enter member user ID"
                            required
                        />
                        <p className="text-xs text-muted-foreground">Get this from the Members tab</p>
                    </div>

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
                        <Label htmlFor="contribution_date">Date *</Label>
                        <Input
                            id="contribution_date"
                            type="date"
                            value={formData.contribution_date}
                            onChange={(e) => setFormData({ ...formData, contribution_date: e.target.value })}
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

                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                            id="notes"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Additional notes..."
                            rows={2}
                        />
                    </div>

                    <div className="flex gap-2 justify-end">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Adding..." : "Add Contribution"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}

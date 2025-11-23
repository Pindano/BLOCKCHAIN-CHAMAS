// components/dashboard/contributions/LiveReconciliationEditor.tsx
"use client"

import { useState, useEffect } from "react"
import { useUser } from "@/lib/UserContext"
import { getSupabaseClient } from "@/lib/supabase-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Upload, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { uploadProposalToIPFS } from "@/app/actions/ipfs"

interface ContributionRow {
    id: string
    memberEmail: string
    memberName: string
    amount: string
    date: string
    reference: string
    paymentMethod: string
}

export function LiveReconciliationEditor({ chamaId }: { chamaId: string }) {
    const { user } = useUser()
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [members, setMembers] = useState<any[]>([])
    const [rows, setRows] = useState<ContributionRow[]>([])

    const supabase = getSupabaseClient()

    const handleOpenChange = async (isOpen: boolean) => {
        setOpen(isOpen)
        if (isOpen) {
            // Fetch Chama members
            const { data } = await supabase
                .from("chama_members")
                .select("user_id, users(email, first_name, last_name)")
                .eq("chama_id", chamaId)

            if (data) {
                const membersList = data.map((m: any) => ({
                    email: m.users.email,
                    name: `${m.users.first_name} ${m.users.last_name}`,
                    userId: m.user_id
                }))
                setMembers(membersList)

                // Initialize with member rows
                setRows(membersList.map((m, i) => ({
                    id: `row-${i}`,
                    memberEmail: m.email,
                    memberName: m.name,
                    amount: "",
                    date: new Date().toISOString().split('T')[0],
                    reference: "",
                    paymentMethod: ""
                })))
            }
        }
    }

    const updateRow = (id: string, field: keyof ContributionRow, value: string) => {
        setRows(rows.map(row => row.id === id ? { ...row, [field]: value } : row))
    }

    const addRow = () => {
        setRows([...rows, {
            id: `row-${Date.now()}`,
            memberEmail: "",
            memberName: "",
            amount: "",
            date: new Date().toISOString().split('T')[0],
            reference: "",
            paymentMethod: ""
        }])
    }

    const removeRow = (id: string) => {
        setRows(rows.filter(row => row.id !== id))
    }

    const handleSubmit = async () => {
        if (!user) {
            toast.error("You must be logged in")
            return
        }

        // Filter valid entries (must have email and amount)
        const validRows = rows.filter(r => r.memberEmail && r.amount && parseFloat(r.amount) > 0)

        if (validRows.length === 0) {
            toast.error("Please enter at least one valid contribution")
            return
        }

        setLoading(true)

        try {
            // Map emails to user IDs
            const entriesWithIds = await Promise.all(
                validRows.map(async (row) => {
                    const { data: userData } = await supabase
                        .from("users")
                        .select("user_id")
                        .eq("email", row.memberEmail)
                        .single()

                    return {
                        memberEmail: row.memberEmail,
                        memberName: row.memberName,
                        amount: parseFloat(row.amount),
                        date: row.date,
                        reference: row.reference || undefined,
                        paymentMethod: row.paymentMethod || undefined,
                        memberId: userData?.user_id || null
                    }
                })
            )

            const validEntries = entriesWithIds.filter(e => e.memberId)

            if (validEntries.length === 0) {
                toast.error("No valid members found")
                setLoading(false)
                return
            }

            // Check if PINATA_JWT is set
            const { data: envCheck } = await supabase.rpc('check_env_variable', { var_name: 'PINATA_JWT' }).single()

            // Upload to IPFS
            let ipfsHash: string
            try {
                ipfsHash = await uploadProposalToIPFS({
                    entries: validEntries,
                    uploadedBy: user.user_id,
                    uploadedAt: new Date().toISOString(),
                    chamaId
                })
            } catch (ipfsError: any) {
                console.error("IPFS upload error:", ipfsError)
                toast.error("IPFS upload failed. Please check PINATA_JWT environment variable is set.")
                setLoading(false)
                return
            }

            // Create reconciliation proposal
            const totalAmount = validEntries.reduce((sum, e) => sum + e.amount, 0)

            const { data: proposal, error: proposalError } = await supabase
                .from("proposals")
                .insert({
                    chama_id: chamaId,
                    creator_id: user.user_id,
                    title: `Contribution Reconciliation: ${validEntries.length} entries`,
                    description: `Total: KES ${totalAmount.toLocaleString()}\nEntries: ${validEntries.length}\nIPFS Hash: ${ipfsHash}`,
                    proposal_type: "CONTRIBUTION_RECONCILIATION",
                    ipfs_hash: ipfsHash,
                    status: "pending"
                })
                .select()
                .single()

            if (proposalError) throw proposalError

            toast.success(`Reconciliation proposal created! ${validEntries.length} contributions uploaded.`)
            setOpen(false)

            // Redirect to proposal
            window.location.href = `/dashboard/proposals/${proposal.proposal_id}`
        } catch (err: any) {
            console.error("Upload error:", err)
            toast.error(err.message || "Failed to process reconciliation")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Upload className="w-4 h-4" />
                    Reconcile Contributions
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Contribution Reconciliation</DialogTitle>
                    <DialogDescription>
                        Enter member contributions directly - no CSV needed!
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Spreadsheet-like table */}
                    <div className="rounded-md border overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/50">
                                    <th className="p-2 text-left font-medium w-[200px]">Member Email</th>
                                    <th className="p-2 text-left font-medium w-[150px]">Name</th>
                                    <th className="p-2 text-left font-medium w-[120px]">Amount (KES)</th>
                                    <th className="p-2 text-left font-medium w-[130px]">Date</th>
                                    <th className="p-2 text-left font-medium w-[120px]">Reference</th>
                                    <th className="p-2 text-left font-medium w-[120px]">Method</th>
                                    <th className="p-2 w-[50px]"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row) => (
                                    <tr key={row.id} className="border-b last:border-0">
                                        <td className="p-1">
                                            <Input
                                                value={row.memberEmail}
                                                onChange={(e) => updateRow(row.id, 'memberEmail', e.target.value)}
                                                placeholder="email@example.com"
                                                className="h-8 text-xs"
                                            />
                                        </td>
                                        <td className="p-1">
                                            <Input
                                                value={row.memberName}
                                                onChange={(e) => updateRow(row.id, 'memberName', e.target.value)}
                                                placeholder="Name"
                                                className="h-8 text-xs"
                                            />
                                        </td>
                                        <td className="p-1">
                                            <Input
                                                type="number"
                                                value={row.amount}
                                                onChange={(e) => updateRow(row.id, 'amount', e.target.value)}
                                                placeholder="0"
                                                className="h-8 text-xs"
                                            />
                                        </td>
                                        <td className="p-1">
                                            <Input
                                                type="date"
                                                value={row.date}
                                                onChange={(e) => updateRow(row.id, 'date', e.target.value)}
                                                className="h-8 text-xs"
                                            />
                                        </td>
                                        <td className="p-1">
                                            <Input
                                                value={row.reference}
                                                onChange={(e) => updateRow(row.id, 'reference', e.target.value)}
                                                placeholder="Ref"
                                                className="h-8 text-xs"
                                            />
                                        </td>
                                        <td className="p-1">
                                            <Input
                                                value={row.paymentMethod}
                                                onChange={(e) => updateRow(row.id, 'paymentMethod', e.target.value)}
                                                placeholder="M-Pesa"
                                                className="h-8 text-xs"
                                            />
                                        </td>
                                        <td className="p-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeRow(row.id)}
                                                className="h-8 w-8 p-0"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <Button variant="outline" onClick={addRow} className="gap-2">
                        <Plus className="w-4 h-4" />
                        Add Row
                    </Button>

                    <div className="flex gap-2 justify-end pt-4 border-t">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit} disabled={loading}>
                            {loading ? "Processing..." : "Create Reconciliation Proposal"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

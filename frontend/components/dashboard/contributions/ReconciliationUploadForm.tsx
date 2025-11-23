// components/dashboard/contributions/ReconciliationUploadForm.tsx
"use client"

import { useState } from "react"
import { useUser } from "@/lib/UserContext"
import { getSupabaseClient } from "@/lib/supabase-client"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Upload, Download, FileSpreadsheet } from "lucide-react"
import { toast } from "sonner"
import { uploadToIPFS } from "@/lib/ipfs-service"

interface ContributionEntry {
    memberEmail: string
    memberName: string
    amount: number
    date: string
    reference?: string
    paymentMethod?: string
}

export function ReconciliationUploadForm({ chamaId }: { chamaId: string }) {
    const { user } = useUser()
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [file, setFile] = useState<File | null>(null)
    const [members, setMembers] = useState<any[]>([])

    const supabase = getSupabaseClient()

    const handleOpenChange = async (isOpen: boolean) => {
        setOpen(isOpen)
        if (isOpen) {
            // Fetch Chama members for the template
            const { data } = await supabase
                .from("chama_members")
                .select("user_id, users(email, first_name, last_name)")
                .eq("chama_id", chamaId)

            if (data) {
                setMembers(data.map((m: any) => ({
                    email: m.users.email,
                    name: `${m.users.first_name} ${m.users.last_name}`,
                    userId: m.user_id
                })))
            }
        }
    }

    const downloadTemplate = () => {
        const headers = ['Member Email', 'Member Name', 'Amount (KES)', 'Date (YYYY-MM-DD)', 'Reference', 'Payment Method']
        const exampleRows = members.slice(0, 3).map(m => [
            m.email,
            m.name,
            '1000',
            new Date().toISOString().split('T')[0],
            'MPESA123',
            'M-Pesa'
        ])

        const csv = [headers, ...exampleRows].map(row => row.join(',')).join('\n')
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `contribution-template-${Date.now()}.csv`
        link.click()

        toast.success("Template downloaded! Fill it out and upload.")
    }

    const parseCSV = (text: string): ContributionEntry[] => {
        const lines = text.trim().split('\n')
        const entries: ContributionEntry[] = []

        // Skip header row
        for (let i = 1; i < lines.length; i++) {
            const parts = lines[i].split(',').map(p => p.trim())
            if (parts.length >= 4 && parts[0] && parts[2]) {
                entries.push({
                    memberEmail: parts[0],
                    memberName: parts[1] || '',
                    amount: parseFloat(parts[2]) || 0,
                    date: parts[3] || new Date().toISOString().split('T')[0],
                    reference: parts[4] || undefined,
                    paymentMethod: parts[5] || undefined
                })
            }
        }

        return entries
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user || !file) {
            toast.error("Please select a file")
            return
        }

        setLoading(true)

        try {
            // Read and parse CSV
            const text = await file.text()
            const entries = parseCSV(text)

            if (entries.length === 0) {
                toast.error("No valid entries found in CSV")
                setLoading(false)
                return
            }

            // Map emails to user IDs
            const entriesWithIds = await Promise.all(
                entries.map(async (entry) => {
                    const { data: userData } = await supabase
                        .from("users")
                        .select("user_id")
                        .eq("email", entry.memberEmail)
                        .single()

                    return {
                        ...entry,
                        memberId: userData?.user_id || null
                    }
                })
            )

            // Filter out entries without valid member IDs
            const validEntries = entriesWithIds.filter(e => e.memberId)

            if (validEntries.length === 0) {
                toast.error("No valid members found. Check email addresses.")
                setLoading(false)
                return
            }

            // Upload to IPFS
            const ipfsHash = await uploadToIPFS({
                entries: validEntries,
                uploadedBy: user.user_id,
                uploadedAt: new Date().toISOString(),
                chamaId
            })

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

            toast.success(`Reconciliation proposal created! ${validEntries.length} contributions uploaded to IPFS.`)
            setFile(null)
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
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Contribution Reconciliation</DialogTitle>
                    <DialogDescription>
                        Upload a spreadsheet of member contributions to create a reconciliation proposal
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Step 1: Download Template */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                                1
                            </div>
                            <h3 className="font-semibold">Download Template</h3>
                        </div>
                        <p className="text-sm text-muted-foreground ml-10">
                            Get a pre-filled CSV template with your Chama members
                        </p>
                        <div className="ml-10">
                            <Button onClick={downloadTemplate} variant="outline" className="gap-2">
                                <Download className="w-4 h-4" />
                                Download CSV Template
                            </Button>
                        </div>
                    </div>

                    {/* Step 2: Fill Out */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-muted-foreground font-bold">
                                2
                            </div>
                            <h3 className="font-semibold">Fill Out Contributions</h3>
                        </div>
                        <p className="text-sm text-muted-foreground ml-10">
                            Open the CSV in Excel/Google Sheets and enter contribution amounts, dates, and references
                        </p>
                    </div>

                    {/* Step 3: Upload */}
                    <form onSubmit={handleSubmit} className="space-y-3">
                        <div className="flex items-center gap-2">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-muted-foreground font-bold">
                                3
                            </div>
                            <h3 className="font-semibold">Upload & Create Proposal</h3>
                        </div>
                        <div className="ml-10 space-y-3">
                            <div className="space-y-2">
                                <Label htmlFor="csv-file">Select CSV File</Label>
                                <div className="flex gap-2">
                                    <input
                                        id="csv-file"
                                        type="file"
                                        accept=".csv"
                                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium"
                                    />
                                </div>
                                {file && (
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <FileSpreadsheet className="w-3 h-3" />
                                        {file.name}
                                    </p>
                                )}
                            </div>

                            <div className="p-3 rounded-lg bg-muted/50 text-sm">
                                <p className="font-medium mb-1">What happens next:</p>
                                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                    <li>Data uploaded to IPFS (permanent record)</li>
                                    <li>Reconciliation proposal created</li>
                                    <li>Members vote to approve</li>
                                    <li>On approval, contributions added to database</li>
                                </ul>
                            </div>

                            <div className="flex gap-2 justify-end">
                                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={!file || loading}>
                                    {loading ? "Processing..." : "Upload & Create Proposal"}
                                </Button>
                            </div>
                        </div>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    )
}

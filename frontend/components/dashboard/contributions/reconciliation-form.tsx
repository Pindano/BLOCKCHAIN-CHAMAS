"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Trash2, Upload, Loader2 } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase-client"
import { toast } from "sonner"

interface ReconciliationFormProps {
    chamaId: string
    onSubmit: (data: any) => Promise<void>
    isLoading: boolean
}

interface ContributionEntry {
    id: string
    memberId: string
    memberName: string // For display
    amount: number
    date: string
    reference: string
}

export function ReconciliationForm({ chamaId, onSubmit, isLoading }: ReconciliationFormProps) {
    const [entries, setEntries] = useState<ContributionEntry[]>([])
    const [members, setMembers] = useState<any[]>([])
    const [currentEntry, setCurrentEntry] = useState<Partial<ContributionEntry>>({
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        reference: ""
    })
    const supabase = getSupabaseClient()

    useEffect(() => {
        const fetchMembers = async () => {
            const { data } = await supabase
                .from("chama_members")
                .select("user_id, users(first_name, last_name, email)")
                .eq("chama_id", chamaId)

            if (data) {
                setMembers(data.map((m: any) => ({
                    id: m.user_id,
                    name: `${m.users.first_name} ${m.users.last_name} (${m.users.email})`
                })))
            }
        }
        fetchMembers()
    }, [chamaId])

    const addEntry = () => {
        if (!currentEntry.memberId || !currentEntry.amount || !currentEntry.date) {
            toast.error("Please fill in all fields")
            return
        }

        const member = members.find(m => m.id === currentEntry.memberId)

        setEntries([
            ...entries,
            {
                id: Math.random().toString(36).substr(2, 9),
                memberId: currentEntry.memberId,
                memberName: member?.name || "Unknown",
                amount: Number(currentEntry.amount),
                date: currentEntry.date,
                reference: currentEntry.reference || ""
            }
        ])

        // Reset form but keep date
        setCurrentEntry({
            ...currentEntry,
            memberId: "",
            amount: 0,
            reference: ""
        })
    }

    const removeEntry = (id: string) => {
        setEntries(entries.filter(e => e.id !== id))
    }

    const handleSubmit = () => {
        if (entries.length === 0) {
            toast.error("Please add at least one contribution")
            return
        }
        onSubmit({ entries })
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end border p-4 rounded-lg bg-gray-50">
                <div className="space-y-2 md:col-span-2">
                    <Label>Member</Label>
                    <Select
                        value={currentEntry.memberId}
                        onValueChange={(val) => setCurrentEntry({ ...currentEntry, memberId: val })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select member" />
                        </SelectTrigger>
                        <SelectContent>
                            {members.map((m) => (
                                <SelectItem key={m.id} value={m.id}>
                                    {m.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>Amount</Label>
                    <Input
                        type="number"
                        value={currentEntry.amount}
                        onChange={(e) => setCurrentEntry({ ...currentEntry, amount: Number(e.target.value) })}
                    />
                </div>

                <div className="space-y-2">
                    <Label>Date</Label>
                    <Input
                        type="date"
                        value={currentEntry.date}
                        onChange={(e) => setCurrentEntry({ ...currentEntry, date: e.target.value })}
                    />
                </div>

                <div className="space-y-2 md:col-span-3">
                    <Label>Reference / Note</Label>
                    <Input
                        value={currentEntry.reference}
                        onChange={(e) => setCurrentEntry({ ...currentEntry, reference: e.target.value })}
                        placeholder="e.g. M-PESA Ref: QWE12345"
                    />
                </div>

                <Button onClick={addEntry} className="w-full">
                    <Plus className="w-4 h-4 mr-2" /> Add Entry
                </Button>
            </div>

            {entries.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Member</TableHead>
                                <TableHead>Reference</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {entries.map((entry) => (
                                <TableRow key={entry.id}>
                                    <TableCell>{entry.date}</TableCell>
                                    <TableCell>{entry.memberName}</TableCell>
                                    <TableCell>{entry.reference}</TableCell>
                                    <TableCell className="text-right font-mono">{entry.amount.toLocaleString()}</TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" onClick={() => removeEntry(entry.id)}>
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            <TableRow className="bg-gray-50 font-bold">
                                <TableCell colSpan={3}>Total</TableCell>
                                <TableCell className="text-right">
                                    {entries.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
                                </TableCell>
                                <TableCell></TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
            )}

            <Button onClick={handleSubmit} disabled={isLoading || entries.length === 0} className="w-full">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                Submit for Reconciliation
            </Button>
        </div>
    )
}

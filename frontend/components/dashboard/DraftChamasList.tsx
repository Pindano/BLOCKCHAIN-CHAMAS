// components/dashboard/DraftChamasList.tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, ArrowRight, Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useUser } from "@/lib/UserContext"
import { getSupabaseClient } from "@/lib/supabase-client"

interface DraftChama {
    chama_id: string
    name: string
    description: string
    created_at: string
    metadata: any
}

export function DraftChamasList() {
    const { user, isLoading: isUserLoading } = useUser()
    const [drafts, setDrafts] = useState<DraftChama[]>([])
    const [loading, setLoading] = useState(true)
    const [deleting, setDeleting] = useState<string | null>(null)
    const router = useRouter()
    const supabase = getSupabaseClient()

    useEffect(() => {
        if (isUserLoading || !user) return
        fetchDrafts()
    }, [user, isUserLoading])

    const fetchDrafts = async () => {
        if (!user) return
        setLoading(true)

        try {
            const { data, error } = await supabase
                .from("chamas")
                .select("*")
                .eq("creator_id", user.user_id)
                .eq("status", "draft")
                .order("created_at", { ascending: false })

            if (error) throw error
            setDrafts(data || [])
        } catch (error) {
            console.error("Error fetching drafts:", error)
            toast.error("Failed to load draft Chamas")
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (chamaId: string) => {
        if (!confirm("Are you sure you want to delete this draft? This cannot be undone.")) {
            return
        }

        setDeleting(chamaId)
        try {
            const { error } = await supabase
                .from("chamas")
                .delete()
                .eq("chama_id", chamaId)

            if (error) throw error

            toast.success("Draft deleted")
            setDrafts(drafts.filter(d => d.chama_id !== chamaId))
        } catch (error: any) {
            toast.error(error.message || "Failed to delete draft")
        } finally {
            setDeleting(null)
        }
    }

    const handleContinue = (chamaId: string) => {
        router.push(`/chama/create?chamaId=${chamaId}`)
    }

    if (loading) {
        return (
            <Card>
                <CardContent className="py-8">
                    <div className="flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (drafts.length === 0) {
        return null
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Draft Chamas
                        </CardTitle>
                        <CardDescription>
                            Continue setting up your unfinished Chamas
                        </CardDescription>
                    </div>
                    <Badge variant="secondary">{drafts.length} draft{drafts.length !== 1 ? 's' : ''}</Badge>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {drafts.map((draft) => (
                        <div
                            key={draft.chama_id}
                            className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                        >
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-medium">{draft.name}</h4>
                                    <Badge variant="outline" className="text-xs">Draft</Badge>
                                </div>
                                {draft.description && (
                                    <p className="text-sm text-muted-foreground line-clamp-1">
                                        {draft.description}
                                    </p>
                                )}
                                <p className="text-xs text-muted-foreground mt-1">
                                    Started {new Date(draft.created_at).toLocaleDateString()}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDelete(draft.chama_id)}
                                    disabled={deleting === draft.chama_id}
                                >
                                    {deleting === draft.chama_id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Trash2 className="w-4 h-4" />
                                    )}
                                </Button>
                                <Button
                                    onClick={() => handleContinue(draft.chama_id)}
                                    size="sm"
                                    className="gap-2"
                                >
                                    Continue Setup
                                    <ArrowRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

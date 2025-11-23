// components/dashboard/proposals/CommentsSection.tsx
"use client"

import { useState, useEffect } from "react"
import { useUser } from "@/lib/UserContext"
import { getSupabaseClient } from "@/lib/supabase-client"
import type { Comment } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { MessageSquare, Send } from "lucide-react"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"

interface CommentWithUser extends Comment {
    users?: { first_name: string; last_name: string }
}

export function CommentsSection({ proposalId }: { proposalId: string }) {
    const { user } = useUser()
    const [comments, setComments] = useState<CommentWithUser[]>([])
    const [newComment, setNewComment] = useState("")
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)

    const supabase = getSupabaseClient()

    useEffect(() => {
        fetchComments()

        // Subscribe to new comments
        const channel = supabase
            .channel(`comments-${proposalId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'comments',
                filter: `proposal_id=eq.${proposalId}`
            }, () => {
                fetchComments()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [proposalId])

    const fetchComments = async () => {
        const { data, error } = await supabase
            .from("comments")
            .select("*, users(first_name, last_name)")
            .eq("proposal_id", proposalId)
            .is("parent_comment_id", null)
            .order("created_at", { ascending: false })

        if (!error && data) {
            setComments(data as CommentWithUser[])
        }
        setLoading(false)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newComment.trim()) {
            toast.error("Please enter a comment")
            return
        }

        if (!user) {
            toast.error("You must be logged in to comment")
            return
        }

        setSubmitting(true)

        try {
            const { error } = await supabase.from("comments").insert({
                proposal_id: proposalId,
                user_id: user.user_id,
                content: newComment.trim()
            })

            if (error) {
                console.error("Comment error:", error)
                toast.error(`Failed to post comment: ${error.message}`)
            } else {
                setNewComment("")
                toast.success("Comment posted!")
                fetchComments()
            }
        } catch (err) {
            console.error("Unexpected error:", err)
            toast.error("An unexpected error occurred")
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Discussion ({comments.length})
                </CardTitle>
                <CardDescription>Share your thoughts and questions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Comment Form */}
                <form onSubmit={handleSubmit} className="space-y-3">
                    <Textarea
                        placeholder="Add your comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        rows={3}
                        className="resize-none"
                    />
                    <div className="flex justify-end">
                        <Button type="submit" disabled={!newComment.trim() || submitting} className="gap-2">
                            <Send className="w-4 h-4" />
                            {submitting ? "Posting..." : "Post Comment"}
                        </Button>
                    </div>
                </form>

                {/* Comments List */}
                <div className="space-y-4 mt-6">
                    {loading ? (
                        <p className="text-sm text-muted-foreground text-center py-4">Loading comments...</p>
                    ) : comments.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">No comments yet. Be the first to comment!</p>
                    ) : (
                        comments.map((comment) => (
                            <div key={comment.comment_id} className="border rounded-lg p-4 space-y-2">
                                <div className="flex items-center justify-between">
                                    <p className="font-medium text-sm">
                                        {comment.users?.first_name} {comment.users?.last_name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                    </p>
                                </div>
                                <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

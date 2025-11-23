// components/dashboard/InvitationsList.tsx
"use client"

import { useEffect, useState } from "react"
import { useUser } from "@/lib/UserContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Mail, Check, X, Users } from "lucide-react"
import { acceptInvitation, rejectInvitation, getPendingInvitations } from "@/app/actions/invitations"
import { toast } from "sonner"

interface Invitation {
    invitation_id: string
    chama_id: string
    email: string
    message?: string
    created_at: string
    chamas: {
        name: string
        description?: string
    }
    users: {
        first_name: string
        last_name: string
    }
}

export function InvitationsList() {
    const { user } = useUser()
    const [invitations, setInvitations] = useState<Invitation[]>([])
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState<string | null>(null)

    useEffect(() => {
        if (user?.email) {
            fetchInvitations()
        }
    }, [user])

    const fetchInvitations = async () => {
        if (!user?.email) return

        setLoading(true)
        try {
            const data = await getPendingInvitations(user.email)
            setInvitations(data as Invitation[])
        } catch (error) {
            console.error("Error fetching invitations:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleAccept = async (invitationId: string) => {
        if (!user) return

        setProcessing(invitationId)
        try {
            await acceptInvitation(invitationId, user.user_id)
            toast.success("Invitation accepted!")
            setInvitations(invitations.filter(inv => inv.invitation_id !== invitationId))
        } catch (error: any) {
            toast.error(error.message || "Failed to accept invitation")
        } finally {
            setProcessing(null)
        }
    }

    const handleReject = async (invitationId: string) => {
        setProcessing(invitationId)
        try {
            await rejectInvitation(invitationId)
            toast.success("Invitation rejected")
            setInvitations(invitations.filter(inv => inv.invitation_id !== invitationId))
        } catch (error: any) {
            toast.error(error.message || "Failed to reject invitation")
        } finally {
            setProcessing(null)
        }
    }

    if (loading) {
        return null
    }

    if (invitations.length === 0) {
        return null
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    <CardTitle>Pending Invitations</CardTitle>
                </div>
                <CardDescription>
                    You have {invitations.length} pending Chama invitation{invitations.length !== 1 ? 's' : ''}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                {invitations.map((invitation) => (
                    <div
                        key={invitation.invitation_id}
                        className="flex items-center justify-between p-4 rounded-lg border"
                    >
                        <div className="flex items-center gap-3 flex-1">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <Users className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{invitation.chamas.name}</p>
                                <p className="text-sm text-muted-foreground">
                                    Invited by {invitation.users.first_name} {invitation.users.last_name}
                                </p>
                                {invitation.message && (
                                    <p className="text-xs text-muted-foreground mt-1 italic">
                                        "{invitation.message}"
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                className="gap-1"
                                onClick={() => handleAccept(invitation.invitation_id)}
                                disabled={processing === invitation.invitation_id}
                            >
                                <Check className="w-4 h-4" />
                                Accept
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                className="gap-1"
                                onClick={() => handleReject(invitation.invitation_id)}
                                disabled={processing === invitation.invitation_id}
                            >
                                <X className="w-4 h-4" />
                                Reject
                            </Button>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}

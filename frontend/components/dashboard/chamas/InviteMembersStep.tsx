// components/dashboard/chamas/InviteMembersStep.tsx
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Mail, UserPlus, Check, X, Clock, Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { inviteMember, getChamaInvitations } from "@/app/actions/invitations"

interface InviteMembersStepProps {
    chamaId: string
    chamaName: string
    userId: string
    onContinue: () => void
}

interface Invitation {
    invitation_id: string
    email: string
    status: "pending" | "accepted" | "rejected"
    created_at: string
}

interface Member {
    users: {
        email: string
        first_name: string
        last_name: string
        wallet_address: string | null
    }
    role: string
}

export function InviteMembersStep({ chamaId, chamaName, userId, onContinue }: InviteMembersStepProps) {
    const [email, setEmail] = useState("")
    const [message, setMessage] = useState("")
    const [sending, setSending] = useState(false)
    const [loading, setLoading] = useState(true)
    const [invitations, setInvitations] = useState<Invitation[]>([])
    const [members, setMembers] = useState<Member[]>([])

    useEffect(() => {
        fetchData()
    }, [chamaId])

    const fetchData = async () => {
        setLoading(true)
        try {
            const data = await getChamaInvitations(chamaId)
            setInvitations(data.invitations as Invitation[])
            setMembers(data.members as Member[])
        } catch (error) {
            console.error("Error fetching data:", error)
            toast.error("Failed to load invitations")
        } finally {
            setLoading(false)
        }
    }

    const handleSendInvite = async () => {
        if (!email.trim()) {
            toast.error("Please enter an email address")
            return
        }

        // Basic email validation
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            toast.error("Please enter a valid email address")
            return
        }

        setSending(true)
        try {
            await inviteMember(chamaId, email.trim(), userId, message.trim() || undefined)
            toast.success(`Invitation sent to ${email}`)
            setEmail("")
            setMessage("")
            fetchData() // Refresh the list
        } catch (error: any) {
            toast.error(error.message || "Failed to send invitation")
        } finally {
            setSending(false)
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "pending":
                return <Badge variant="outline" className="gap-1"><Clock className="w-3 h-3" /> Pending</Badge>
            case "accepted":
                return <Badge variant="default" className="gap-1 bg-green-500"><Check className="w-3 h-3" /> Accepted</Badge>
            case "rejected":
                return <Badge variant="destructive" className="gap-1"><X className="w-3 h-3" /> Declined</Badge>
            default:
                return <Badge variant="secondary">{status}</Badge>
        }
    }

    const acceptedCount = invitations.filter(inv => inv.status === "accepted").length
    const pendingCount = invitations.filter(inv => inv.status === "pending").length
    const totalMembers = members.length
    const membersWithWallets = members.filter(m => m.users.wallet_address).length

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold mb-2">Invite Members</h2>
                <p className="text-muted-foreground">
                    Invite people to join {chamaName}. They'll receive an email invitation.
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Total Members</CardDescription>
                        <CardTitle className="text-3xl">{totalMembers}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Accepted Invites</CardDescription>
                        <CardTitle className="text-3xl">{acceptedCount}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Pending Invites</CardDescription>
                        <CardTitle className="text-3xl">{pendingCount}</CardTitle>
                    </CardHeader>
                </Card>
            </div>

            {/* Send Invitation Form */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <UserPlus className="w-5 h-5" />
                        Send Invitation
                    </CardTitle>
                    <CardDescription>Invite a new member by email</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="member@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onKeyPress={(e) => e.key === "Enter" && handleSendInvite()}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="message">Personal Message (Optional)</Label>
                        <Input
                            id="message"
                            placeholder="Join us in our savings group..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                        />
                    </div>
                    <Button onClick={handleSendInvite} disabled={sending} className="w-full gap-2">
                        {sending ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            <>
                                <Mail className="w-4 h-4" />
                                Send Invitation
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {/* Members & Invitations List */}
            <Card>
                <CardHeader>
                    <CardTitle>Members & Invitations</CardTitle>
                    <CardDescription>
                        {membersWithWallets}/{totalMembers} members have logged in (wallets are automatically created)
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {/* Current Members */}
                            {members.map((member, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 rounded-lg border">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                            <span className="text-sm font-medium">
                                                {member.users.first_name?.[0]}{member.users.last_name?.[0]}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="font-medium">
                                                {member.users.first_name} {member.users.last_name}
                                            </p>
                                            <p className="text-sm text-muted-foreground">{member.users.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline">{member.role}</Badge>
                                        {member.users.wallet_address && (
                                            <Badge variant="secondary" className="gap-1 text-xs">
                                                {member.users.wallet_address.slice(0, 6)}...{member.users.wallet_address.slice(-4)}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {/* Invitations */}
                            {invitations.map((invitation) => (
                                <div key={invitation.invitation_id} className="flex items-center justify-between p-3 rounded-lg border border-dashed">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                                            <Mail className="w-5 h-5 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <p className="font-medium">{invitation.email}</p>
                                            <p className="text-xs text-muted-foreground">
                                                Invited {new Date(invitation.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    {getStatusBadge(invitation.status)}
                                </div>
                            ))}

                            {members.length === 0 && invitations.length === 0 && (
                                <p className="text-center text-muted-foreground py-8">
                                    No members or invitations yet. Start by inviting someone!
                                </p>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Continue Button */}
            <div className="flex justify-between items-center pt-4">
                <div className="text-sm text-muted-foreground">
                    {totalMembers > 0 ? (
                        <span>✓ You have {totalMembers} member{totalMembers !== 1 ? "s" : ""}</span>
                    ) : (
                        <span>⚠️ You need at least 1 member to continue</span>
                    )}
                </div>
                <Button
                    onClick={onContinue}
                    size="lg"
                    disabled={totalMembers === 0}
                >
                    Continue to Publish
                </Button>
            </div>
        </div>
    )
}

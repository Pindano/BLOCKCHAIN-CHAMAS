"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
    Users,
    TrendingUp,
    Wallet,
    Share2,
    Settings,
    LogOut,
    Crown,
    CheckCircle2
} from "lucide-react"

const MOCK_USER = {
    name: "Sarah Njeri",
    email: "sarah.njeri@example.com",
    walletAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    joinedDate: "March 2023",
    totalChamas: 3,
    totalWealth: "KES 2,450,000",
    contributionsMade: 36,
    proposalsVoted: 24
}

const MOCK_MY_CHAMAS = [
    {
        id: 1,
        name: "Nairobi Women's Circle",
        members: 24,
        myContribution: "KES 1,200,000",
        position: 7,
        nextPayout: "Dec 12, 2025",
        status: "Active",
        role: "Member"
    },
    {
        id: 2,
        name: "Tech Professionals Savings",
        members: 15,
        myContribution: "KES 750,000",
        position: 3,
        nextPayout: "Jan 8, 2026",
        status: "Active",
        role: "Admin"
    },
    {
        id: 3,
        name: "Family Investment Group",
        members: 8,
        myContribution: "KES 500,000",
        position: 5,
        nextPayout: "Dec 20, 2025",
        status: "Active",
        role: "Member"
    }
]

export default function ProfilePage() {
    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="kitenge-pattern-header relative h-32 md:h-40 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/80" />
            </div>

            <div className="container mx-auto px-4 mt-8 pb-12">
                {/* Profile Card */}
                <Card className="mb-8">
                    <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                            <Avatar className="w-24 h-24 border-4 border-background shadow-lg">
                                <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-[var(--kente-orange)] to-[var(--ankara-teal)] text-white">
                                    SN
                                </AvatarFallback>
                            </Avatar>

                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h1 className="text-3xl font-heading font-bold">{MOCK_USER.name}</h1>
                                    <Badge variant="secondary" className="gap-1">
                                        <CheckCircle2 className="w-3 h-3" />
                                        Verified
                                    </Badge>
                                </div>
                                <p className="text-muted-foreground mb-3">{MOCK_USER.email}</p>
                                <div className="flex flex-wrap gap-4 text-sm">
                                    <div className="flex items-center gap-2">
                                        <Wallet className="w-4 h-4 text-muted-foreground" />
                                        <code className="text-xs">{MOCK_USER.walletAddress.slice(0, 10)}...{MOCK_USER.walletAddress.slice(-8)}</code>
                                    </div>
                                    <div className="text-muted-foreground">
                                        Member since {MOCK_USER.joinedDate}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Button variant="outline" className="gap-2">
                                    <Share2 className="w-4 h-4" />
                                    Invite Friends
                                </Button>
                                <Button variant="outline" size="icon">
                                    <Settings className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Stats Grid */}
                <div className="grid md:grid-cols-4 gap-4 mb-8">
                    <StatsCard
                        title="Total Chamas"
                        value={MOCK_USER.totalChamas.toString()}
                        icon={<Users className="w-5 h-5" />}
                    />
                    <StatsCard
                        title="Total Wealth"
                        value={MOCK_USER.totalWealth}
                        icon={<TrendingUp className="w-5 h-5" />}
                    />
                    <StatsCard
                        title="Contributions Made"
                        value={MOCK_USER.contributionsMade.toString()}
                        icon={<CheckCircle2 className="w-5 h-5" />}
                    />
                    <StatsCard
                        title="Proposals Voted"
                        value={MOCK_USER.proposalsVoted.toString()}
                        icon={<Crown className="w-5 h-5" />}
                    />
                </div>


                {/* Quick Actions */}
                <Card className="mt-8">
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                        <CardDescription>Manage your account and settings</CardDescription>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-4">
                        <Button variant="outline" className="justify-start h-auto py-4 gap-3">
                            <Share2 className="w-5 h-5 text-[var(--kente-orange)]" />
                            <div className="text-left">
                                <p className="font-semibold">Invite Friends</p>
                                <p className="text-xs text-muted-foreground">Share ChamaDao via WhatsApp</p>
                            </div>
                        </Button>
                        <Button variant="outline" className="justify-start h-auto py-4 gap-3">
                            <Settings className="w-5 h-5 text-[var(--ankara-teal)]" />
                            <div className="text-left">
                                <p className="font-semibold">Account Settings</p>
                                <p className="text-xs text-muted-foreground">Update your profile and preferences</p>
                            </div>
                        </Button>
                        <Button variant="outline" className="justify-start h-auto py-4 gap-3">
                            <Wallet className="w-5 h-5 text-[var(--adinkra-gold)]" />
                            <div className="text-left">
                                <p className="font-semibold">Wallet Settings</p>
                                <p className="text-xs text-muted-foreground">Manage your embedded wallet</p>
                            </div>
                        </Button>
                        <Button variant="outline" className="justify-start h-auto py-4 gap-3 text-red-600 hover:text-red-600">
                            <LogOut className="w-5 h-5" />
                            <div className="text-left">
                                <p className="font-semibold">Sign Out</p>
                                <p className="text-xs text-muted-foreground">Log out of your account</p>
                            </div>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

function StatsCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
    return (
        <Card className="smooth-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                <div className="text-[var(--kente-orange)]">{icon}</div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
            </CardContent>
        </Card>
    )
}

function ChamaCard({ chama }: { chama: typeof MOCK_MY_CHAMAS[0] }) {
    return (
        <Card className="smooth-hover">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{chama.name}</CardTitle>
                        <div className="flex items-center gap-2">
                            <Badge variant="secondary">{chama.role}</Badge>
                            <Badge variant="outline">{chama.status}</Badge>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Members</span>
                    <span className="font-semibold">{chama.members}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">My Contribution</span>
                    <span className="font-semibold text-[var(--kente-orange)]">{chama.myContribution}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">My Position</span>
                    <span className="font-semibold">#{chama.position} of {chama.members}</span>
                </div>
                <div className="pt-3 border-t">
                    <p className="text-xs text-muted-foreground mb-1">Next Payout</p>
                    <p className="text-sm font-semibold">{chama.nextPayout}</p>
                </div>
                <Button variant="outline" className="w-full">
                    View Details
                </Button>
            </CardContent>
        </Card>
    )
}

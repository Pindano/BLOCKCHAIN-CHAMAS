// components/dashboard/ProposalListItem.tsx
"use client"

import { ArrowRight, Clock, CheckCircle2, XCircle, Circle } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { Badge } from "@/components/ui/badge"

interface ProposalListItemProps {
    proposalId: string
    title: string
    status: string
    votingEnd?: string
    chamaName?: string
}

export function ProposalListItem({ proposalId, title, status, votingEnd, chamaName }: ProposalListItemProps) {
    const getStatusIcon = () => {
        switch (status) {
            case "active":
                return <Circle className="w-4 h-4 text-blue-500 fill-blue-500" />
            case "approved":
                return <CheckCircle2 className="w-4 h-4 text-green-500" />
            case "rejected":
                return <XCircle className="w-4 h-4 text-red-500" />
            default:
                return <Clock className="w-4 h-4 text-gray-500" />
        }
    }

    const getStatusColor = () => {
        switch (status) {
            case "active":
                return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
            case "approved":
                return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
            case "rejected":
                return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
            default:
                return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
        }
    }

    return (
        <Link href={`/dashboard/proposals/${proposalId}`}>
            <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer group">
                <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        {getStatusIcon()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{title}</p>
                        <div className="flex items-center gap-2 mt-1">
                            {chamaName && (
                                <p className="text-xs text-muted-foreground">{chamaName}</p>
                            )}
                            {votingEnd && status === "active" && (
                                <p className="text-xs text-muted-foreground">
                                    • Ends {formatDistanceToNow(new Date(votingEnd), { addSuffix: true })}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Badge variant="secondary" className={getStatusColor()}>
                        {status}
                    </Badge>
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </div>
            </div>
        </Link>
    )
}

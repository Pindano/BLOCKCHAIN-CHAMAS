// components/dashboard/ActivityListItem.tsx
"use client"

import { ArrowRight, Bell, Vote, Users, Wallet } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

interface ActivityListItemProps {
    type: string
    message: string
    timestamp: string
    link?: string
}

export function ActivityListItem({ type, message, timestamp, link }: ActivityListItemProps) {
    const getIcon = () => {
        switch (type) {
            case "proposal":
                return <Vote className="w-5 h-5 text-blue-500" />
            case "contribution":
                return <Wallet className="w-5 h-5 text-green-500" />
            case "member":
                return <Users className="w-5 h-5 text-purple-500" />
            default:
                return <Bell className="w-5 h-5 text-gray-500" />
        }
    }

    const content = (
        <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer group">
            <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    {getIcon()}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}
                    </p>
                </div>
            </div>
            {link && (
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform flex-shrink-0" />
            )}
        </div>
    )

    if (link) {
        return <Link href={link}>{content}</Link>
    }

    return content
}

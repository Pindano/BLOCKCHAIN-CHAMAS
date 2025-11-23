// components/EmptyState.tsx
import React from "react"

interface EmptyStateProps {
    icon: React.ReactNode
    title: string
    description: string
    action?: React.ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
                {icon}
            </div>
            <h3 className="text-lg font-semibold mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">{description}</p>
            {action && <div>{action}</div>}
        </div>
    )
}

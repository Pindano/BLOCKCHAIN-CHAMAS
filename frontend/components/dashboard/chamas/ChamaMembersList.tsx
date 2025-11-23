// components/dashboard/chamas/ChamaMembersList.tsx
"use client"

import type { ChamaMember } from "@/lib/types"
import { Badge } from "@/components/ui/badge"

interface ChamaMembersListProps {
  members: (ChamaMember & { users: { first_name: string; last_name: string; email: string } })[]
}

export function ChamaMembersList({ members }: ChamaMembersListProps) {
  if (members.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No members yet. Be the first to join!
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {members.map((member) => (
        <div 
          key={member.chama_member_id} 
          className="flex items-center justify-between p-3 bg-muted rounded-lg"
        >
          <div>
            <p className="font-medium">
              {member.users.first_name} {member.users.last_name}
            </p>
            <p className="text-sm text-muted-foreground">{member.users.email}</p>
          </div>
          <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
            {member.role}
          </Badge>
        </div>
      ))}
    </div>
  )
}

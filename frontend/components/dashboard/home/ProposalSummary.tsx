// components/dashboard/home/ProposalSummary.tsx
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { ProposalWithDetails } from "../proposals-view"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface ProposalSummaryProps {
  proposals: ProposalWithDetails[]
}

export function ProposalSummary({ proposals }: ProposalSummaryProps) {
  const router = useRouter()
  
  const activeProposals = proposals.filter(p => p.isVotingActive).length
  const endedProposals = proposals.length - activeProposals

  return (
    <Card>
      <CardHeader>
        <CardTitle>Proposal Summary</CardTitle>
        <CardDescription>A quick look at recent activity.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col items-center justify-center p-4 bg-muted rounded-lg">
            <span className="text-3xl font-bold">{activeProposals}</span>
            <span className="text-sm text-muted-foreground">Active</span>
          </div>
          <div className="flex flex-col items-center justify-center p-4 bg-muted rounded-lg">
            <span className="text-3xl font-bold">{endedProposals}</span>
            <span className="text-sm text-muted-foreground">Ended</span>
          </div>
        </div>
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => router.push('/dashboard/proposals')}
        >
          View All Proposals
        </Button>
      </CardContent>
    </Card>
  )
}

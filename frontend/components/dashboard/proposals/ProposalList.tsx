// components/dashboard/proposals/ProposalList.tsx
"use client"

import type { ProposalWithDetails } from "../proposals-view"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface ProposalListProps {
  proposals: ProposalWithDetails[]
  userVotes: Record<string, string>
  onVote: (proposalId: string, choice: string) => Promise<void>
}

export function ProposalList({ proposals, userVotes, onVote }: ProposalListProps) {

  if (proposals.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No proposals found.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {proposals.map((proposal) => {
        const hasVoted = !!userVotes[proposal.proposal_id]

        return (
          <div key={proposal.proposal_id} className="border rounded-lg overflow-hidden">
            {/* Clickable header area */}
            <Link href={`/dashboard/proposals/${proposal.proposal_id}`}>
              <div className="p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="flex justify-between items-start mb-2">
                  <span
                    className={cn(
                      "text-xs font-semibold uppercase",
                      proposal.isVotingActive ? "text-green-600" : "text-muted-foreground"
                    )}
                  >
                    {proposal.isVotingActive ? "● Active" : "Ended"}
                  </span>
                  <Badge variant="outline">{proposal.chamaName}</Badge>
                </div>

                <h3 className="font-semibold text-lg mb-2">{proposal.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{proposal.description}</p>

                {/* Vote Counts */}
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="bg-muted p-2 rounded text-center">
                    <p className="text-xs text-muted-foreground">For</p>
                    <p className="font-semibold">{proposal.votes_for}</p>
                  </div>
                  <div className="bg-muted p-2 rounded text-center">
                    <p className="text-xs text-muted-foreground">Against</p>
                    <p className="font-semibold">{proposal.votes_against}</p>
                  </div>
                  <div className="bg-muted p-2 rounded text-center">
                    <p className="text-xs text-muted-foreground">Abstain</p>
                    <p className="font-semibold">{proposal.votes_abstain}</p>
                  </div>
                </div>
              </div>
            </Link>

            {/* Vote Actions - not clickable */}
            <div className="px-4 pb-4">
              {hasVoted ? (
                <div className="text-sm text-center font-medium text-muted-foreground bg-muted p-3 rounded">
                  You voted: <span className="font-semibold capitalize">{userVotes[proposal.proposal_id]}</span>
                </div>
              ) : proposal.isVotingActive ? (
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => onVote(proposal.proposal_id, "for")} className="flex-1">
                    For
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onVote(proposal.proposal_id, "against")} className="flex-1">
                    Against
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onVote(proposal.proposal_id, "abstain")} className="flex-1">
                    Abstain
                  </Button>
                </div>
              ) : (
                <div className="text-sm text-center text-muted-foreground">
                  Voting has ended.
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

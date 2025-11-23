import { getSupabaseClient } from "@/lib/supabase-client"

export type ActivityType =
    | "proposal_created"
    | "vote_cast"
    | "chama_created"
    | "chama_published"
    | "member_joined"
    | "contribution_made"
    | "loan_requested"
    | "loan_approved"
    | "loan_repaid"
    | "proposal_executed"

interface CreateActivityParams {
    chama_id: string
    user_id: string
    type: ActivityType
    title: string
    description: string
    metadata?: Record<string, any>
}

/**
 * Creates an activity record in the database
 * Activities are used to populate the activity feed in Chama pages
 */
export async function createActivity(params: CreateActivityParams) {
    const supabase = getSupabaseClient()

    const { data, error } = await supabase
        .from("activities")
        .insert({
            chama_id: params.chama_id,
            user_id: params.user_id,
            type: params.type,
            title: params.title,
            description: params.description,
            metadata: params.metadata || {},
        })
        .select()
        .single()

    if (error) {
        console.error("Error creating activity:", error)
        throw error
    }

    return data
}

/**
 * Helper functions for common activity types
 */

export async function createProposalActivity(
    chamaId: string,
    userId: string,
    proposalId: string,
    proposalTitle: string
) {
    return createActivity({
        chama_id: chamaId,
        user_id: userId,
        type: "proposal_created",
        title: "New Proposal Created",
        description: `Created proposal: "${proposalTitle}"`,
        metadata: { proposal_id: proposalId },
    })
}

export async function createVoteActivity(
    chamaId: string,
    userId: string,
    proposalId: string,
    proposalTitle: string,
    vote: "for" | "against" | "abstain"
) {
    const voteText = vote === "for" ? "in favor of" : vote === "against" ? "against" : "abstained on"
    return createActivity({
        chama_id: chamaId,
        user_id: userId,
        type: "vote_cast",
        title: "Vote Cast",
        description: `Voted ${voteText} "${proposalTitle}"`,
        metadata: { proposal_id: proposalId, vote },
    })
}

export async function createChamaPublishedActivity(
    chamaId: string,
    userId: string,
    chamaName: string
) {
    return createActivity({
        chama_id: chamaId,
        user_id: userId,
        type: "chama_published",
        title: "Chama Published",
        description: `${chamaName} was published to the blockchain`,
        metadata: {},
    })
}

export async function createMemberJoinedActivity(
    chamaId: string,
    userId: string,
    memberName: string
) {
    return createActivity({
        chama_id: chamaId,
        user_id: userId,
        type: "member_joined",
        title: "New Member Joined",
        description: `${memberName} joined the Chama`,
        metadata: {},
    })
}

export async function createContributionActivity(
    chamaId: string,
    userId: string,
    amount: number,
    currency: string = "KES"
) {
    return createActivity({
        chama_id: chamaId,
        user_id: userId,
        type: "contribution_made",
        title: "Contribution Made",
        description: `Contributed ${currency} ${amount.toLocaleString()}`,
        metadata: { amount, currency },
    })
}

// lib/notifications.ts
"use server"

import { getSupabaseServer } from "@/lib/supabase-server"

/**
 * Helper functions to create in-app notifications
 * These work alongside email notifications
 */

export async function createNotification(
    userId: string,
    title: string,
    message: string,
    type: "info" | "success" | "warning" | "error" = "info",
    link?: string
) {
    const supabase = await getSupabaseServer()

    try {
        await supabase.from("notifications").insert({
            user_id: userId,
            title,
            message,
            type,
            link,
        })
        return { success: true }
    } catch (error) {
        console.error("Error creating notification:", error)
        return { success: false, error }
    }
}

export async function notifyInvitation(
    userId: string,
    chamaName: string,
    inviterName: string
) {
    return createNotification(
        userId,
        "New Chama Invitation",
        `${inviterName} invited you to join ${chamaName}`,
        "info",
        "/dashboard"
    )
}

export async function notifyVoteRecorded(
    userId: string,
    proposalTitle: string,
    proposalId: string
) {
    return createNotification(
        userId,
        "Vote Recorded",
        `Your vote on "${proposalTitle}" has been recorded successfully`,
        "success",
        `/dashboard/proposals/${proposalId}`
    )
}

export async function notifyProposalActive(
    userId: string,
    proposalTitle: string,
    chamaName: string,
    proposalId: string
) {
    return createNotification(
        userId,
        "New Proposal Active",
        `"${proposalTitle}" is now active in ${chamaName}. Cast your vote!`,
        "info",
        `/dashboard/proposals/${proposalId}`
    )
}

export async function notifyChamaCreated(
    userId: string,
    chamaName: string,
    chamaId: string
) {
    return createNotification(
        userId,
        "Chama Created Successfully",
        `Your Chama "${chamaName}" has been created as a draft. Invite members and publish when ready.`,
        "success",
        `/dashboard/chama/${chamaId}`
    )
}

export async function notifyChamaPublished(
    userId: string,
    chamaName: string,
    chamaId: string
) {
    return createNotification(
        userId,
        `${chamaName} is Live!`,
        `The Chama has been published on-chain. You can now participate in proposals and contributions.`,
        "success",
        `/dashboard/chama/${chamaId}`
    )
}

export async function notifyInvitationResponse(
    userId: string,
    memberName: string,
    chamaName: string,
    accepted: boolean,
    chamaId: string
) {
    return createNotification(
        userId,
        accepted ? "Invitation Accepted" : "Invitation Declined",
        `${memberName} has ${accepted ? "accepted" : "declined"} your invitation to join ${chamaName}`,
        accepted ? "success" : "info",
        `/dashboard/chama/${chamaId}`
    )
}

export async function notifyProposalCreated(
    userId: string,
    proposalTitle: string,
    chamaName: string,
    proposalId: string
) {
    return createNotification(
        userId,
        "Proposal Created",
        `Your proposal "${proposalTitle}" has been created in ${chamaName}`,
        "success",
        `/dashboard/proposals/${proposalId}`
    )
}

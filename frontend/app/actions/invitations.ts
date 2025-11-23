// app/actions/invitations.ts
"use server"

import { getSupabaseServer } from "@/lib/supabase-server"
import { revalidatePath } from "next/cache"

export async function inviteMember(
    chamaId: string,
    email: string,
    invitedBy: string,
    message?: string
) {
    const supabase = await getSupabaseServer()

    try {
        // Check if user is already a member
        const { data: existingMember } = await supabase
            .from("chama_members")
            .select("member_id")
            .eq("chama_id", chamaId)
            .eq("user_id", (
                await supabase.from("users").select("user_id").eq("email", email).single()
            ).data?.user_id)
            .single()

        if (existingMember) {
            throw new Error("User is already a member of this Chama")
        }

        // Check if invitation already exists
        const { data: existingInvite } = await supabase
            .from("invitations")
            .select("invitation_id, status")
            .eq("chama_id", chamaId)
            .eq("email", email)
            .single()

        if (existingInvite) {
            if (existingInvite.status === "pending") {
                throw new Error("Invitation already sent to this email")
            }
            // If rejected, we can resend
            if (existingInvite.status === "rejected") {
                const { error: updateError } = await supabase
                    .from("invitations")
                    .update({ status: "pending", created_at: new Date().toISOString(), responded_at: null })
                    .eq("invitation_id", existingInvite.invitation_id)

                if (updateError) throw updateError

                // TODO: Send email notification
                revalidatePath("/dashboard/chamas")
                return { success: true, resent: true }
            }
        }

        // Create new invitation
        const { data: invitation, error: insertError } = await supabase
            .from("invitations")
            .insert({
                chama_id: chamaId,
                email,
                invited_by: invitedBy,
                message,
            })
            .select()
            .single()

        if (insertError) throw insertError

        // Send email notification to invitee
        try {
            const { data: inviter } = await supabase
                .from("users")
                .select("first_name, last_name")
                .eq("user_id", invitedBy)
                .single()

            const { data: chama } = await supabase
                .from("chamas")
                .select("name")
                .eq("chama_id", chamaId)
                .single()

            if (inviter && chama) {
                const { sendEmail } = await import("@/lib/email")
                const { InvitationEmail } = await import("@/lib/email-templates")

                await sendEmail({
                    to: email,
                    subject: `Invitation to join ${chama.name}`,
                    react: InvitationEmail({
                        chamaName: chama.name,
                        inviterName: `${inviter.first_name} ${inviter.last_name}`,
                        message,
                    }),
                })
            }
        } catch (emailError) {
            console.error("Error sending invitation email:", emailError)
            // Don't fail the invitation if email fails
        }

        // Create in-app notification for invitee (if they're already a user)
        const { data: inviteeUser } = await supabase
            .from("users")
            .select("user_id")
            .eq("email", email)
            .single()

        if (inviteeUser) {
            const { data: chama } = await supabase
                .from("chamas")
                .select("name")
                .eq("chama_id", chamaId)
                .single()

            await supabase.from("notifications").insert({
                user_id: inviteeUser.user_id,
                title: "New Chama Invitation",
                message: `You've been invited to join ${chama?.name || "a Chama"}`,
                type: "info",
                link: `/dashboard`,
            })
        }

        revalidatePath("/dashboard/chamas")
        return { success: true, invitation }
    } catch (error: any) {
        console.error("Error inviting member:", error)
        throw new Error(error.message || "Failed to send invitation")
    }
}

export async function acceptInvitation(invitationId: string, userId: string) {
    const supabase = await getSupabaseServer()

    try {
        // Get invitation details
        const { data: invitation, error: fetchError } = await supabase
            .from("invitations")
            .select("*, chamas(name)")
            .eq("invitation_id", invitationId)
            .single()

        if (fetchError) throw fetchError
        if (!invitation) throw new Error("Invitation not found")
        if (invitation.status !== "pending") {
            throw new Error("Invitation has already been responded to")
        }

        // Add user to Chama
        const { error: memberError } = await supabase
            .from("chama_members")
            .insert({
                chama_id: invitation.chama_id,
                user_id: userId,
                role: "member",
            })

        if (memberError) throw memberError

        // Update invitation status
        const { error: updateError } = await supabase
            .from("invitations")
            .update({
                status: "accepted",
                responded_at: new Date().toISOString(),
            })
            .eq("invitation_id", invitationId)

        if (updateError) throw updateError

        // Notify admin using helper
        const { notifyInvitationResponse } = await import("@/lib/notifications")
        const { data: acceptingUser } = await supabase
            .from("users")
            .select("first_name, last_name")
            .eq("user_id", userId)
            .single()

        if (acceptingUser) {
            await notifyInvitationResponse(
                invitation.invited_by,
                `${acceptingUser.first_name} ${acceptingUser.last_name}`,
                invitation.chamas?.name || "Chama",
                true,
                invitation.chama_id
            )
        }

        revalidatePath("/dashboard")
        revalidatePath("/dashboard/chamas")
        return { success: true }
    } catch (error: any) {
        console.error("Error accepting invitation:", error)
        throw new Error(error.message || "Failed to accept invitation")
    }
}

export async function rejectInvitation(invitationId: string) {
    const supabase = await getSupabaseServer()

    try {
        const { data: invitation, error: fetchError } = await supabase
            .from("invitations")
            .select("*, chamas(name)")
            .eq("invitation_id", invitationId)
            .single()

        if (fetchError) throw fetchError
        if (!invitation) throw new Error("Invitation not found")

        // Update invitation status
        const { error: updateError } = await supabase
            .from("invitations")
            .update({
                status: "rejected",
                responded_at: new Date().toISOString(),
            })
            .eq("invitation_id", invitationId)

        if (updateError) throw updateError

        // Notify admin
        await supabase.from("notifications").insert({
            user_id: invitation.invited_by,
            title: "Invitation Rejected",
            message: `A member has declined your invitation to join ${invitation.chamas?.name}`,
            type: "info",
            link: `/dashboard/chama/${invitation.chama_id}`,
        })

        revalidatePath("/dashboard")
        return { success: true }
    } catch (error: any) {
        console.error("Error rejecting invitation:", error)
        throw new Error(error.message || "Failed to reject invitation")
    }
}

export async function getPendingInvitations(email: string) {
    const supabase = await getSupabaseServer()

    try {
        const { data, error } = await supabase
            .from("invitations")
            .select("*, chamas(name, description), users!invitations_invited_by_fkey(first_name, last_name)")
            .eq("email", email)
            .eq("status", "pending")
            .order("created_at", { ascending: false })

        if (error) throw error
        return data || []
    } catch (error) {
        console.error("Error fetching invitations:", error)
    }
}

export async function getChamaInvitations(chamaId: string) {
    const supabase = await getSupabaseServer()

    try {
        // Get all invitations for this Chama
        const { data: invitations, error: invError } = await supabase
            .from("invitations")
            .select("*, users!invitations_invited_by_fkey(first_name, last_name)")
            .eq("chama_id", chamaId)
            .order("created_at", { ascending: false })

        if (invError) throw invError

        // Get all members for this Chama
        const { data: members, error: memError } = await supabase
            .from("chama_members")
            .select("*, users(email, first_name, last_name, wallet_address)")
            .eq("chama_id", chamaId)

        if (memError) throw memError

        return {
            invitations: invitations || [],
            members: members || [],
        }
    } catch (error) {
        console.error("Error fetching Chama invitations:", error)
        return {
            invitations: [],
            members: [],
        }
    }
}


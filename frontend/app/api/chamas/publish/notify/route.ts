// app/api/chamas/publish/notify/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase-server"
import { sendEmail } from "@/lib/email"
import { ChamaPublishedEmail } from "@/lib/email-templates"

export async function POST(request: NextRequest) {
    try {
        const { chamaId } = await request.json()

        if (!chamaId) {
            return NextResponse.json({ error: "Chama ID is required" }, { status: 400 })
        }

        const supabase = await getSupabaseServer()

        // Get Chama details
        const { data: chama } = await supabase
            .from("chamas")
            .select("name, chama_id")
            .eq("chama_id", chamaId)
            .single()

        if (!chama) {
            return NextResponse.json({ error: "Chama not found" }, { status: 404 })
        }

        // Get all members
        const { data: members } = await supabase
            .from("chama_members")
            .select("user_id, users(email, first_name)")
            .eq("chama_id", chamaId)

        // Send emails and notifications to all members
        if (members && members.length > 0) {
            for (const member of members) {
                try {
                    // Send email
                    if (member.users?.email) {
                        await sendEmail({
                            to: member.users.email,
                            subject: `${chama.name} is now live on-chain!`,
                            react: ChamaPublishedEmail({
                                chamaName: chama.name,
                                chamaId: chama.chama_id,
                            }),
                        })
                    }

                    // Create notification
                    await supabase.from("notifications").insert({
                        user_id: member.user_id,
                        title: `${chama.name} is now on-chain!`,
                        message: `The Chama has been published to the blockchain. You can now participate in proposals and contributions.`,
                        type: "success",
                        link: `/dashboard/chama/${chamaId}`,
                    })
                } catch (emailError) {
                    console.error(`Error notifying member ${member.user_id}:`, emailError)
                }
            }
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error("Error sending notifications:", error)
        return NextResponse.json(
            { error: error.message || "Failed to send notifications" },
            { status: 500 }
        )
    }
}

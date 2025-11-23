// app/actions/reconciliation.ts
"use server"

import { getSupabaseServer } from "@/lib/supabase-server"
import { revalidatePath } from "next/cache"

export async function processReconciliationApproval(proposalId: string) {
    try {
        const supabase = await getSupabaseServer()

        // Get proposal with IPFS data
        const { data: proposal, error: proposalError } = await supabase
            .from("proposals")
            .select("ipfs_hash, chama_id")
            .eq("proposal_id", proposalId)
            .eq("proposal_type", "CONTRIBUTION_RECONCILIATION")
            .single()

        if (proposalError || !proposal) {
            throw new Error("Proposal not found")
        }

        // Fetch reconciliation data from IPFS
        const ipfsResponse = await fetch(`https://gateway.pinata.cloud/ipfs/${proposal.ipfs_hash}`)
        const reconciliationData = await ipfsResponse.json()

        if (!reconciliationData.entries || !Array.isArray(reconciliationData.entries)) {
            throw new Error("Invalid reconciliation data")
        }

        // Insert all contributions
        const contributionsToInsert = reconciliationData.entries.map((entry: any) => ({
            chama_id: proposal.chama_id,
            member_id: entry.memberId,
            amount: entry.amount,
            contribution_date: entry.date,
            reference: entry.reference || null,
            status: "reconciled",
            reconciliation_proposal_id: proposalId,
        }))

        const { error: insertError } = await supabase
            .from("contributions")
            .insert(contributionsToInsert)

        if (insertError) {
            throw new Error(`Failed to insert contributions: ${insertError.message}`)
        }

        // Update Chama total contributions
        const totalAmount = reconciliationData.entries.reduce(
            (sum: number, entry: any) => sum + entry.amount,
            0
        )

        const { data: chamaData } = await supabase
            .from("chamas")
            .select("total_contributions")
            .eq("chama_id", proposal.chama_id)
            .single()

        const newTotal = (chamaData?.total_contributions || 0) + totalAmount

        await supabase
            .from("chamas")
            .update({ total_contributions: newTotal })
            .eq("chama_id", proposal.chama_id)

        revalidatePath("/dashboard")
        revalidatePath(`/dashboard/chamas/${proposal.chama_id}`)

        return { success: true, contributionsAdded: contributionsToInsert.length }
    } catch (error: any) {
        console.error("Reconciliation processing error:", error)
        throw new Error(error.message || "Failed to process reconciliation")
    }
}

"use server"

import { getSupabaseServer } from "@/lib/supabase-server"
import { processReconciliationApproval } from "@/app/actions/reconciliation"

/**
 * Check for succeeded reconciliation proposals and process them
 * This should be called periodically or when a proposal changes status
 */
export async function checkAndProcessReconciliations() {
    try {
        const supabase = await getSupabaseServer()

        // Find all executed CONTRIBUTION_RECONCILIATION proposals that haven't been processed
        const { data: proposals, error } = await supabase
            .from("proposals")
            .select("*")
            .eq("proposal_type", "CONTRIBUTION_RECONCILIATION")
            .eq("status", "Executed")
            .is("processed_at", null) // Not yet processed

        if (error) throw error

        if (!proposals || proposals.length === 0) {
            return { processed: 0, message: "No pending reconciliations to process" }
        }

        let processed = 0
        const results = []

        for (const proposal of proposals) {
            try {
                // Process the reconciliation
                const result = await processReconciliationApproval(proposal.proposal_id)

                // Mark as processed
                await supabase
                    .from("proposals")
                    .update({ processed_at: new Date().toISOString() })
                    .eq("proposal_id", proposal.proposal_id)

                processed++
                results.push({
                    proposalId: proposal.proposal_id,
                    success: true,
                    contributionsAdded: result.contributionsAdded
                })
            } catch (err) {
                console.error(`Failed to process reconciliation ${proposal.proposal_id}:`, err)
                results.push({
                    proposalId: proposal.proposal_id,
                    success: false,
                    error: err instanceof Error ? err.message : "Unknown error"
                })
            }
        }

        return {
            processed,
            total: proposals.length,
            results
        }
    } catch (error) {
        console.error("Error checking reconciliations:", error)
        throw error
    }
}

/**
 * Process a specific reconciliation proposal
 */
export async function processSpecificReconciliation(proposalId: string) {
    try {
        const supabase = getSupabaseServer()

        // Check if proposal is a succeeded reconciliation
        const { data: proposal, error } = await supabase
            .from("proposals")
            .select("proposal_type, status, processed_at")
            .eq("proposal_id", proposalId)
            .single()

        if (error) throw error

        if (proposal.proposal_type !== "CONTRIBUTION_RECONCILIATION") {
            throw new Error("Not a reconciliation proposal")
        }

        if (proposal.status !== "Succeeded") {
            throw new Error("Proposal has not succeeded yet")
        }

        if (proposal.processed_at) {
            throw new Error("Reconciliation already processed")
        }

        // Process the reconciliation
        const result = await processReconciliationApproval(proposalId)

        // Mark as processed
        await supabase
            .from("proposals")
            .update({ processed_at: new Date().toISOString() })
            .eq("proposal_id", proposalId)

        return {
            success: true,
            contributionsAdded: result.contributionsAdded
        }
    } catch (error) {
        console.error("Error processing specific reconciliation:", error)
        throw error
    }
}

"use server"

import { getSupabaseServer } from "@/lib/supabase-server"
import { processLoanApproval } from "@/app/actions/loans"
import { processRepaymentApproval } from "@/app/actions/loan-repayments"

/**
 * Check for succeeded loan request proposals and process them
 */
export async function checkAndProcessLoanApprovals() {
    try {
        const supabase = await getSupabaseServer()

        // Find all executed LOAN_REQUEST proposals that haven't been processed
        const { data: proposals, error } = await supabase
            .from("proposals")
            .select("proposal_id")
            .eq("proposal_type", "LOAN_REQUEST")
            .eq("status", "Executed")  // Changed from "Succeeded" to "Executed"
            .is("processed_at", null)

        if (error) throw error

        if (!proposals || proposals.length === 0) {
            return { processed: 0, message: "No pending loan approvals to process" }
        }

        let processed = 0
        const results = []

        for (const proposal of proposals) {
            try {
                // Process the loan approval
                const result = await processLoanApproval(proposal.proposal_id)

                // Mark as processed
                await supabase
                    .from("proposals")
                    .update({ processed_at: new Date().toISOString() })
                    .eq("proposal_id", proposal.proposal_id)

                processed++
                results.push({
                    proposalId: proposal.proposal_id,
                    success: true,
                    loanId: result.loanId
                })
            } catch (err) {
                console.error(`Failed to process loan approval ${proposal.proposal_id}:`, err)
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
        console.error("Error checking loan approvals:", error)
        throw error
    }
}

/**
 * Check for succeeded loan repayment proposals and process them
 */
export async function checkAndProcessRepaymentApprovals() {
    try {
        const supabase = await getSupabaseServer()

        // Find all executed LOAN_REPAYMENT proposals that haven't been processed
        const { data: proposals, error } = await supabase
            .from("proposals")
            .select("proposal_id")
            .eq("proposal_type", "LOAN_REPAYMENT")
            .eq("status", "Executed")  // Changed from "Succeeded" to "Executed"
            .is("processed_at", null)

        if (error) throw error

        if (!proposals || proposals.length === 0) {
            return { processed: 0, message: "No pending repayment approvals to process" }
        }

        let processed = 0
        const results = []

        for (const proposal of proposals) {
            try {
                // Process the repayment approval
                const result = await processRepaymentApproval(proposal.proposal_id)

                // Mark as processed
                await supabase
                    .from("proposals")
                    .update({ processed_at: new Date().toISOString() })
                    .eq("proposal_id", proposal.proposal_id)

                processed++
                results.push({
                    proposalId: proposal.proposal_id,
                    success: true,
                    amount: result.repaymentAmount
                })
            } catch (err) {
                console.error(`Failed to process repayment approval ${proposal.proposal_id}:`, err)
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
        console.error("Error checking repayment approvals:", error)
        throw error
    }
}

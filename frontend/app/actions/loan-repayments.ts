"use server"

import { getSupabaseServer } from "@/lib/supabase-server"
import { revalidatePath } from "next/cache"

interface LoanRepaymentData {
    loanId: string
    borrowerId: string
    borrowerName: string
    repaymentAmount: number
    paymentDate: string
    paymentMethod: string
    reference: string
    previousBalance: number
    newBalance: number
    recordedBy: string
    createdAt: string
}

/**
 * Process an approved loan repayment proposal
 * Called when a LOAN_REPAYMENT proposal is approved
 */
export async function processRepaymentApproval(proposalId: string) {
    try {
        const supabase = await getSupabaseServer()

        // Get proposal with IPFS data
        const { data: proposal, error: proposalError } = await supabase
            .from("proposals")
            .select("ipfs_hash, chama_id")
            .eq("proposal_id", proposalId)
            .eq("proposal_type", "LOAN_REPAYMENT")
            .single()

        if (proposalError || !proposal) {
            throw new Error("Repayment proposal not found")
        }

        // Fetch repayment data from IPFS
        const ipfsResponse = await fetch(`https://gateway.pinata.cloud/ipfs/${proposal.ipfs_hash}`)
        const repaymentData: LoanRepaymentData = await ipfsResponse.json()

        if (!repaymentData.loanId || !repaymentData.repaymentAmount) {
            throw new Error("Invalid repayment data")
        }

        // Insert repayment record
        const { error: insertError } = await supabase
            .from("loan_repayments")
            .insert({
                loan_id: repaymentData.loanId,
                amount: repaymentData.repaymentAmount,
                payment_date: repaymentData.paymentDate,
                reference: repaymentData.reference,
                payment_method: repaymentData.paymentMethod,
                proposal_id: proposalId,
                status: "verified",
                ipfs_hash: proposal.ipfs_hash,
                recorded_by: repaymentData.recordedBy
            })

        if (insertError) {
            throw new Error(`Failed to insert repayment: ${insertError.message}`)
        }

        // Update loan outstanding balance
        await supabase
            .from("loans")
            .update({
                outstanding_balance: repaymentData.newBalance,
                status: repaymentData.newBalance <= 0 ? "repaid" : "active"
            })
            .eq("loan_id", repaymentData.loanId)

        // Update chama treasury (add repayment amount back)
        // This could be extended to track total_loans_repaid

        revalidatePath("/dashboard")
        revalidatePath(`/dashboard/loans`)
        revalidatePath(`/loan/${repaymentData.loanId}`)

        return { success: true, repaymentAmount: repaymentData.repaymentAmount }
    } catch (error: any) {
        console.error("Repayment approval processing error:", error)
        throw new Error(error.message || "Failed to process repayment approval")
    }
}

/**
 * Get all repayments for a specific loan
 */
export async function getLoanRepayments(loanId: string) {
    try {
        const supabase = await getSupabaseServer()

        const { data: repayments, error } = await supabase
            .from("loan_repayments")
            .select(`
                *,
                users!loan_repayments_recorded_by_fkey (first_name, last_name, email)
            `)
            .eq("loan_id", loanId)
            .order("payment_date", { ascending: false })

        if (error) throw error

        return repayments || []
    } catch (error: any) {
        console.error("Error fetching loan repayments:", error)
        throw error
    }
}

/**
 * Calculate updated loan balance after a repayment
 */
export async function calculateNewBalance(loanId: string, repaymentAmount: number) {
    try {
        const supabase = await getSupabaseServer()

        const { data: loan, error } = await supabase
            .from("loans")
            .select("outstanding_balance")
            .eq("loan_id", loanId)
            .single()

        if (error) throw error

        const newBalance = Math.max(0, (loan.outstanding_balance || 0) - repaymentAmount)
        return newBalance
    } catch (error: any) {
        console.error("Error calculating new balance:", error)
        throw error
    }
}

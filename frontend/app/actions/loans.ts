"use server"

import { getSupabaseServer } from "@/lib/supabase-server"
import { revalidatePath } from "next/cache"

interface LoanRequestData {
    chamaId: string
    borrowerId: string
    borrowerName: string
    borrowerEmail: string
    principalAmount: number
    interestRate: number
    termMonths: number
    monthlyPayment: number
    purpose: string
    collateralDescription: string
    requestedDate: string
    createdBy: string
}

export async function createLoanRequest(
    chamaId: string,
    userId: string,
    amount: number,
    purpose: string,
    repaymentPeriodMonths: number,
    interestRate: number = 0
) {
    const supabase = await getSupabaseServer()

    try {
        // Calculate monthly payment
        const totalAmount = amount * (1 + interestRate / 100)
        const monthlyPayment = totalAmount / repaymentPeriodMonths

        // Create loan record
        const { data: loan, error: loanError } = await supabase
            .from("loans")
            .insert({
                chama_id: chamaId,
                borrower_id: userId,
                amount,
                purpose,
                interest_rate: interestRate,
                repayment_period_months: repaymentPeriodMonths,
                monthly_payment: monthlyPayment,
                status: "pending",
            })
            .select()
            .single()

        if (loanError) throw loanError

        // Create proposal for loan approval
        const { data: proposal, error: proposalError } = await supabase
            .from("proposals")
            .insert({
                chama_id: chamaId,
                creator_id: userId,
                title: `Loan Request: KES ${amount.toLocaleString()}`,
                description: `${purpose}\n\nAmount: KES ${amount.toLocaleString()}\nRepayment Period: ${repaymentPeriodMonths} months\nMonthly Payment: KES ${monthlyPayment.toFixed(2)}\nInterest Rate: ${interestRate}%`,
                proposal_type: "LOAN_REQUEST",
                status: "pending",
            })
            .select()
            .single()

        if (proposalError) throw proposalError

        // Link proposal to loan
        await supabase
            .from("loans")
            .update({ proposal_id: proposal.proposal_id })
            .eq("loan_id", loan.loan_id)

        revalidatePath("/dashboard")
        return { success: true, loanId: loan.loan_id, proposalId: proposal.proposal_id }
    } catch (error: any) {
        console.error("Error creating loan request:", error)
        throw new Error(error.message || "Failed to create loan request")
    }
}

export async function addRepayment(
    loanId: string,
    amount: number,
    paymentDate: string,
    reference?: string,
    paymentMethod?: string
) {
    const supabase = await getSupabaseServer()

    try {
        // Get current loan
        const { data: loan, error: loanError } = await supabase
            .from("loans")
            .select("*")
            .eq("loan_id", loanId)
            .single()

        if (loanError) throw loanError

        // Create repayment record
        const { error: repaymentError } = await supabase
            .from("loan_repayments")
            .insert({
                loan_id: loanId,
                amount,
                payment_date: paymentDate,
                reference,
                payment_method: paymentMethod,
            })

        if (repaymentError) throw repaymentError

        // Update loan amount_repaid
        const newAmountRepaid = Number(loan.amount_repaid) + amount
        const totalAmount = Number(loan.amount) * (1 + Number(loan.interest_rate) / 100)

        // Update status if fully repaid
        const newStatus = newAmountRepaid >= totalAmount ? "repaid" : loan.status

        await supabase
            .from("loans")
            .update({
                amount_repaid: newAmountRepaid,
                status: newStatus,
            })
            .eq("loan_id", loanId)

        revalidatePath("/dashboard")
        return { success: true }
    } catch (error: any) {
        console.error("Error adding repayment:", error)
        throw new Error(error.message || "Failed to add repayment")
    }
}

export async function updateLoanStatus(loanId: string, status: string) {
    const supabase = await getSupabaseServer()

    try {
        const updates: any = { status }

        if (status === "disbursed") {
            updates.disbursement_date = new Date().toISOString().split("T")[0]
            updates.status = "active"
        }

        if (status === "approved") {
            updates.approval_date = new Date().toISOString().split("T")[0]
        }

        await supabase.from("loans").update(updates).eq("loan_id", loanId)

        revalidatePath("/dashboard")
        return { success: true }
    } catch (error: any) {
        console.error("Error updating loan status:", error)
        throw new Error(error.message || "Failed to update loan status")
    }
}

/**
 * Process an approved loan request proposal
 * Called when a LOAN_REQUEST proposal is approved
 */
export async function processLoanApproval(proposalId: string) {
    try {
        const supabase = await getSupabaseServer()

        // Get proposal with IPFS data
        const { data: proposal, error: proposalError } = await supabase
            .from("proposals")
            .select("ipfs_hash, chama_id")
            .eq("proposal_id", proposalId)
            .eq("proposal_type", "LOAN_REQUEST")
            .single()

        if (proposalError || !proposal) {
            throw new Error("Loan proposal not found")
        }

        // Fetch loan request data from IPFS
        const ipfsResponse = await fetch(`https://gateway.pinata.cloud/ipfs/${proposal.ipfs_hash}`)
        const loanData: LoanRequestData = await ipfsResponse.json()

        if (!loanData.borrowerId || !loanData.principalAmount) {
            throw new Error("Invalid loan request data")
        }

        // Calculate outstanding balance (principal + interest)
        const totalInterest = (loanData.principalAmount * loanData.interestRate * loanData.termMonths) / (12 * 100)
        const outstandingBalance = loanData.principalAmount + totalInterest

        // Insert loan record
        const { data: loan, error: insertError } = await supabase
            .from("loans")
            .insert({
                chama_id: proposal.chama_id,
                borrower_id: loanData.borrowerId,
                proposal_id: proposalId,
                principal_amount: loanData.principalAmount, // Changed to 'principal_amount' to match schema
                interest_rate: loanData.interestRate,
                term_months: loanData.termMonths, // Changed to 'term_months' to match schema
                monthly_payment: loanData.monthlyPayment,
                outstanding_balance: outstandingBalance,
                purpose: loanData.purpose,
                collateral_description: loanData.collateralDescription,
                status: "active",
                ipfs_hash: proposal.ipfs_hash,
                disbursement_date: new Date().toISOString(),
                // due_date: new Date(Date.now() + loanData.termMonths * 30 * 24 * 60 * 60 * 1000).toISOString() // Schema might not have due_date, check schema
            })
            .select()
            .single()

        if (insertError) {
            throw new Error(`Failed to insert loan: ${insertError.message}`)
        }

        revalidatePath("/dashboard")
        revalidatePath(`/dashboard/loans`)

        return { success: true, loanId: loan.loan_id, amount: loanData.principalAmount }
    } catch (error: any) {
        console.error("Loan approval processing error:", error)
        throw new Error(error.message || "Failed to process loan approval")
    }
}

/**
 * Get loan details by ID
 */
export async function getLoanDetails(loanId: string) {
    try {
        const supabase = await getSupabaseServer()

        const { data: loan, error } = await supabase
            .from("loans")
            .select(`
                *,
                chamas (name),
                users (first_name, last_name, email)
            `)
            .eq("loan_id", loanId)
            .single()

        if (error) throw error

        return loan
    } catch (error: any) {
        console.error("Error fetching loan details:", error)
        throw error
    }
}

/**
 * Get all loans for a specific member in a chama
 */
export async function getMemberLoans(userId: string, chamaId: string) {
    try {
        const supabase = await getSupabaseServer()

        const { data: loans, error } = await supabase
            .from("loans")
            .select("*")
            .eq("borrower_id", userId)
            .eq("chama_id", chamaId)
            .order("created_at", { ascending: false })

        if (error) throw error

        return loans || []
    } catch (error: any) {
        console.error("Error fetching member loans:", error)
        throw error
    }
}

/**
 * Get all active loans for a chama
 */
export async function getChamaLoans(chamaId: string) {
    try {
        const supabase = await getSupabaseServer()

        const { data: loans, error } = await supabase
            .from("loans")
            .select(`
                *,
                users (first_name, last_name, email)
            `)
            .eq("chama_id", chamaId)
            .order("created_at", { ascending: false })

        if (error) throw error

        return loans || []
    } catch (error: any) {
        console.error("Error fetching chama loans:", error)
        throw error
    }
}

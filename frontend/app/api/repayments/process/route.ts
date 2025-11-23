import { NextResponse } from "next/server"
import { processRepaymentApproval } from "@/app/actions/loan-repayments"

export async function POST(request: Request) {
    try {
        const { proposalId } = await request.json()

        if (!proposalId) {
            return NextResponse.json({ error: 'Proposal ID is required' }, { status: 400 })
        }

        const result = await processRepaymentApproval(proposalId)

        return NextResponse.json({ success: true, result })
    } catch (error: any) {
        console.error("Error processing repayment:", error)
        return NextResponse.json(
            { error: error.message || "Failed to process repayment" },
            { status: 500 }
        )
    }
}

export async function GET() {
    try {
        const result = await checkAndProcessRepaymentApprovals()
        return NextResponse.json(result)
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "Failed to check repayment approvals" },
            { status: 500 }
        )
    }
}

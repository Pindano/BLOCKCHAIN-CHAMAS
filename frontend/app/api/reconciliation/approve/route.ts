import { NextRequest, NextResponse } from "next/server"
import { processReconciliationApproval } from "@/app/actions/reconciliation"

/**
 * API endpoint to process approved reconciliation proposals
 * This should be called when a reconciliation proposal is executed/approved
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { proposalId } = body

        if (!proposalId) {
            return NextResponse.json(
                { error: "Proposal ID is required" },
                { status: 400 }
            )
        }

        // Process the reconciliation approval
        const result = await processReconciliationApproval(proposalId)

        return NextResponse.json({
            success: true,
            message: `Processed reconciliation for ${result.contributionsAdded} contributions`,
            contributionsAdded: result.contributionsAdded
        })
    } catch (error) {
        console.error("Error processing reconciliation approval:", error)
        return NextResponse.json(
            {
                error: "Failed to process reconciliation approval",
                details: error instanceof Error ? error.message : "Unknown error"
            },
            { status: 500 }
        )
    }
}

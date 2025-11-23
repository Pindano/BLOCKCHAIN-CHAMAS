import { NextRequest, NextResponse } from "next/server"
import { checkAndProcessReconciliations } from "@/app/actions/process-reconciliations"

/**
 * API endpoint to check and process all succeeded reconciliation proposals
 * Can be called manually, via webhook, or on a schedule
 */
export async function POST(request: NextRequest) {
    try {
        const result = await checkAndProcessReconciliations()

        return NextResponse.json({
            success: true,
            ...result
        })
    } catch (error) {
        console.error("Error processing reconciliations:", error)
        return NextResponse.json(
            {
                success: false,
                error: "Failed to process reconciliations",
                details: error instanceof Error ? error.message : "Unknown error"
            },
            { status: 500 }
        )
    }
}

/**
 * GET endpoint to check status without processing
 */
export async function GET(request: NextRequest) {
    try {
        const { getSupabaseServer } = await import("@/lib/supabase-server")
        const supabase = getSupabaseServer()

        // Count pending reconciliations
        const { count, error } = await supabase
            .from("proposals")
            .select("*", { count: "exact", head: true })
            .eq("proposal_type", "CONTRIBUTION_RECONCILIATION")
            .eq("status", "Succeeded")
            .is("processed_at", null)

        if (error) throw error

        return NextResponse.json({
            success: true,
            pendingReconciliations: count || 0
        })
    } catch (error) {
        console.error("Error checking reconciliations:", error)
        return NextResponse.json(
            {
                success: false,
                error: "Failed to check reconciliations",
                details: error instanceof Error ? error.message : "Unknown error"
            },
            { status: 500 }
        )
    }
}

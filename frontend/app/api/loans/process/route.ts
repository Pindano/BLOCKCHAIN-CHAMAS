import { NextResponse } from "next/server"
import { checkAndProcessLoanApprovals } from "@/app/actions/process-loans"

export async function POST() {
    try {
        const result = await checkAndProcessLoanApprovals()
        return NextResponse.json(result)
    } catch (error: any) {
        console.error("Error processing loan approvals:", error)
        return NextResponse.json(
            { error: error.message || "Failed to process loan approvals" },
            { status: 500 }
        )
    }
}

export async function GET() {
    try {
        const result = await checkAndProcessLoanApprovals()
        return NextResponse.json(result)
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "Failed to check loan approvals" },
            { status: 500 }
        )
    }
}

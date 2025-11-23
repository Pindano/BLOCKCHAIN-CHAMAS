"use server"

import { getSupabaseServer } from "@/lib/supabase-server"
import { uploadToIPFS } from "@/lib/ipfs-service"
import { recordProposal } from "./proposals"

export async function submitReconciliation(
    chamaId: string,
    userId: string,
    entries: any[]
) {
    try {
        const supabase = await getSupabaseServer()

        // 1. Generate "File" content (JSON for now, could be CSV string)
        const fileContent = JSON.stringify(entries, null, 2)
        const summary = entries.reduce((acc, e) => acc + e.amount, 0)

        // 2. Upload to IPFS
        const ipfsCid = await uploadToIPFS({
            type: "CONTRIBUTION_RECONCILIATION",
            chamaId,
            entries,
            totalAmount: summary,
            submittedAt: new Date().toISOString()
        })

        // 3. Create Proposal
        const title = `Contribution Reconciliation: ${entries.length} entries`
        const description = `Review and approve ${entries.length} contribution entries totaling ${summary}.`

        const proposal = await recordProposal(
            chamaId,
            userId,
            title,
            description,
            "CONTRIBUTION_RECONCILIATION",
            ipfsCid,
            new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days voting
            "pending...", // No tx hash yet
            "pending..."
        )

        return proposal

    } catch (error) {
        console.error("Error submitting reconciliation:", error)
        throw error
    }
}

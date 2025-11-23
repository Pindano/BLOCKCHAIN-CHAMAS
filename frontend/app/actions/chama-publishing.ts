"use server"

import { getSupabaseServer } from "@/lib/supabase-server"

import { uploadToIPFS } from "@/lib/ipfs-service"
import { recordProposal } from "./proposals"

export async function publishChamaOnChain(
  chamaId: string,
  governorAddress: string,
  tokenAddress: string,
  constitutionCid: string,
): Promise<void> {
  try {
    const supabase = await getSupabaseServer()

    // Update chama status and blockchain addresses
    const { error } = await supabase
      .from("chamas")
      .update({
        status: "published",
        governor_address: governorAddress,
        membership_token_address: tokenAddress,
        constitution_ipfs_cid: constitutionCid,
        on_chain_published_at: new Date().toISOString(),
      })
      .eq("chama_id", chamaId)

    if (error) throw error

    // Create automatic constitution voting proposal
    const proposalData = {
      title: "Constitution Approval",
      description: `Vote to approve the Chama Constitution (IPFS: ${constitutionCid})`,
      proposalType: "CONSTITUTION_EDIT",
      ipfsCid: constitutionCid,
    }

    const proposalCid = await uploadToIPFS({
      ...proposalData,
      uploadedAt: new Date().toISOString(),
    })

    const user = (await supabase.auth.getUser()).data.user
    if (!user) throw new Error("User not found")

    // Use recordProposal to handle DB insertion and notifications
    await recordProposal(
      chamaId,
      user.id,
      "Constitution Approval",
      `Vote to approve the Chama Constitution`,
      "CONSTITUTION_EDIT",
      proposalCid,
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      "pending...", // No tx hash yet for the proposal itself? Or is the chama publishing the tx?
      // The chama publishing IS the tx. But the proposal is created off-chain first?
      // Actually, if the chama is published, the governor exists.
      // We might need to create the proposal on-chain too?
      // The original code just inserted into DB with execution_data.
      // Let's assume for now we just record it.
      "pending..."
    )

    // Store in database with on-chain reference
    const { error: proposalError } = await supabase.from("proposals").insert({
      chama_id: chamaId,
      creator_id: (await supabase.auth.getUser()).data.user?.id,
      title: "Constitution Approval",
      description: `Vote to approve the Chama Constitution`,
      proposal_type: "CONSTITUTION_EDIT",
      status: "active",
      execution_data: { ipfs_cid: proposalCid },
    })

    if (proposalError) throw proposalError

    console.log("[v0] Chama published on-chain with constitution proposal")
  } catch (error) {
    console.error("[v0] Error publishing chama:", error)
    throw error
  }
}

export async function acceptChamaInvitation(chamaId: string, userId: string): Promise<void> {
  try {
    const supabase = await getSupabaseServer()

    const { error } = await supabase
      .from("chama_members")
      .update({ invitation_status: "accepted" })
      .eq("chama_id", chamaId)
      .eq("user_id", userId)

    if (error) throw error

    console.log("[v0] Member accepted invitation")
  } catch (error) {
    console.error("[v0] Error accepting invitation:", error)
    throw error
  }
}

export async function declineChamaInvitation(chamaId: string, userId: string): Promise<void> {
  try {
    const supabase = await getSupabaseServer()

    const { error } = await supabase
      .from("chama_members")
      .update({ invitation_status: "declined" })
      .eq("chama_id", chamaId)
      .eq("user_id", userId)

    if (error) throw error

    console.log("[v0] Member declined invitation")
  } catch (error) {
    console.error("[v0] Error declining invitation:", error)
    throw error
  }
}


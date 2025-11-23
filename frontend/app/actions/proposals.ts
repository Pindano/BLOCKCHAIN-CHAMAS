"use server"

import { uploadToIPFS } from "@/lib/ipfs-service"
import type { ProposalType } from "@/lib/blockchain-config"
import { getSupabaseServer } from "@/lib/supabase-server"
import { sendEmail } from "@/lib/email"
import { ProposalCreatedEmail } from "@/components/emails/proposal-created"
import { revalidatePath } from "next/cache"

export interface ProposalTemplate {
  type: ProposalType
  title: string
  description: string
  fields: Record<string, string | number | boolean>
}

export async function uploadProposalToIPFS(template: ProposalTemplate): Promise<string> {
  try {
    const ipfsHash = await uploadToIPFS({
      ...template,
      uploadedAt: new Date().toISOString(),
    })
    console.log("[v0] Uploaded proposal to IPFS:", ipfsHash)
    return ipfsHash
  } catch (error) {
    console.error("[v0] Error uploading to IPFS:", error)
    throw new Error("Failed to upload proposal to IPFS")
  }
}

export async function generateAddMemberTemplate(
  memberEmail: string,
  memberName: string,
  votingPower: number,
): Promise<ProposalTemplate> {
  return {
    type: "ADD_MEMBER",
    title: `Add ${memberName} to Chama`,
    description: `Request to add new member ${memberName} (${memberEmail}) with voting power ${votingPower}`,
    fields: {
      memberEmail,
      memberName,
      votingPower,
    },
  }
}

export async function generateRemoveMemberTemplate(
  memberId: string,
  memberName: string,
  reason: string,
): Promise<ProposalTemplate> {
  return {
    type: "REMOVE_MEMBER",
    title: `Remove ${memberName} from Chama`,
    description: `Request to remove member: ${reason}`,
    fields: {
      memberId,
      memberName,
      reason,
    },
  }
}

export async function generateLoanRequestTemplate(
  amount: number,
  currency: string,
  purpose: string,
  repaymentPeriod: number,
  interestRate: number,
): Promise<ProposalTemplate> {
  return {
    type: "LOAN_REQUEST",
    title: `Loan Request: ${currency} ${amount}`,
    description: `Loan request for ${purpose}. Repayment period: ${repaymentPeriod} months at ${interestRate}% interest`,
    fields: {
      amount,
      currency,
      purpose,
      repaymentPeriod,
      interestRate,
    },
  }
}

export async function generateConstitutionEditTemplate(
  sectionTitle: string,
  oldContent: string,
  newContent: string,
): Promise<ProposalTemplate> {
  return {
    type: "CONSTITUTION_EDIT",
    title: `Edit Constitution: ${sectionTitle}`,
    description: `Proposed change to constitution section`,
    fields: {
      sectionTitle,
      oldContent,
      newContent,
    },
  }
}

export async function generateContributionTemplate(
  memberId: string,
  memberName: string,
  amount: number,
  currency: string,
  period: string,
): Promise<ProposalTemplate> {
  return {
    type: "CONTRIBUTION",
    title: `Contribution: ${memberName} - ${currency} ${amount}`,
    description: `Member contribution for ${period}`,
    fields: {
      memberId,
      memberName,
      amount,
      currency,
      period,
    },
  }
}

export async function generateMemberExitTemplate(
  memberId: string,
  memberName: string,
  reason: string,
): Promise<ProposalTemplate> {
  return {
    type: "MEMBER_EXIT",
    title: `Member Exit: ${memberName}`,
    description: `Member requesting to exit chama: ${reason}`,
    fields: {
      memberId,
      memberName,
      reason,
    },
  }
}

export async function generateIPFSConstitutionTemplate(
  constitutionHash: string,
  version: number,
  description: string,
): Promise<ProposalTemplate> {
  return {
    type: "IPFSConstitutionUpdated",
    title: `Update Constitution (Version ${version})`,
    description: `Constitution updated on IPFS: ${description}`,
    fields: {
      constitutionHash,
      version,
      description,
    },
  }
}


export async function recordProposal(
  chamaId: string,
  creatorId: string,
  title: string,
  description: string,
  proposalType: string,
  ipfsHash: string,
  votingEnd: Date,
  txHash: string,
  onChainId: string
) {
  const supabase = await getSupabaseServer()

  // 1. Insert Proposal
  const { data: proposal, error } = await supabase
    .from("proposals")
    .insert({
      chama_id: chamaId,
      creator_id: creatorId,
      title,
      description,
      proposal_type: proposalType,
      voting_start: new Date().toISOString(),
      voting_end: votingEnd.toISOString(),
      ipfs_hash: ipfsHash,
      blockchain_tx_hash: txHash,
      on_chain_proposal_id: onChainId,
      status: "active",
    })
    .select("*, chamas(name)")
    .single()

  if (error) throw error

  // 2. Create Notification for Creator (and potentially others)
  await supabase.from("notifications").insert({
    user_id: creatorId,
    title: "Proposal Created",
    message: `Your proposal "${title}" has been created successfully.`,
    type: "success",
    link: `/dashboard/proposals`,
  })

  // 3. Send Email to Creator
  const { data: userData } = await supabase
    .from("users")
    .select("email, first_name, last_name")
    .eq("user_id", creatorId)
    .single()

  if (userData?.email) {
    await sendEmail({
      to: userData.email,
      subject: `Proposal Created: ${title}`,
      react: ProposalCreatedEmail({
        memberName: userData.first_name || "Member",
        chamaName: proposal.chamas?.name || "Chama",
        proposalTitle: title,
        proposalDescription: description,
        proposalLink: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/proposals`,
      }),
    })
  }

  // Notify other members (simplified loop for now)
  const { data: members } = await supabase
    .from("chama_members")
    .select("user_id, users(email, first_name)")
    .eq("chama_id", chamaId)
    .neq("user_id", creatorId) // Don't notify creator again

  if (members) {
    const notifications = members.map(m => ({
      user_id: m.user_id,
      title: "New Proposal",
      message: `A new proposal "${title}" has been created in ${proposal.chamas?.name}.`,
      type: "info",
      link: `/dashboard/proposals`,
    }))

    if (notifications.length > 0) {
      await supabase.from("notifications").insert(notifications)
    }

    // Send emails to other members (limit to 5 for demo/safety to avoid spamming if large)
    // In production, use a queue
    for (const member of members.slice(0, 5)) {
      // Supabase join might return an array or object depending on relationship.
      // Assuming 1:1 or N:1, but if it returns array, handle it.
      const user = Array.isArray(member.users) ? member.users[0] : member.users

      if (user?.email) {
        await sendEmail({
          to: user.email,
          subject: `New Proposal in ${proposal.chamas?.name}`,
          react: ProposalCreatedEmail({
            memberName: user.first_name || "Member",
            chamaName: proposal.chamas?.name || "Chama",
            proposalTitle: title,
            proposalDescription: description,
            proposalLink: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/proposals`,
          }),
        })
      }
    }
  }

  revalidatePath("/dashboard/proposals")
  return proposal
}

export async function recordVote(
  proposalId: string,
  userId: string,
  choice: "for" | "against" | "abstain",
  governorAddress: string,
  onChainProposalId: string,
) {
  const supabase = await getSupabaseServer()

  try {
    // First, check if voting has started
    const { data: proposal } = await supabase
      .from("proposals")
      .select("voting_start, voting_end")
      .eq("proposal_id", proposalId)
      .single()

    if (!proposal) {
      throw new Error("Proposal not found")
    }

    const now = new Date()
    const votingStart = proposal.voting_start ? new Date(proposal.voting_start) : null
    const votingEnd = proposal.voting_end ? new Date(proposal.voting_end) : null

    // Check if voting hasn't started yet
    if (votingStart && now < votingStart) {
      const hoursUntilStart = Math.ceil((votingStart.getTime() - now.getTime()) / (1000 * 60 * 60))
      throw new Error(`Voting hasn't started yet. Starts in ${hoursUntilStart} hour${hoursUntilStart !== 1 ? 's' : ''}`)
    }

    // Check if voting has ended
    if (votingEnd && now > votingEnd) {
      throw new Error("Voting has ended for this proposal")
    }

    // Check if user already voted
    const { data: existingVote } = await supabase
      .from("votes")
      .select("vote_id")
      .eq("proposal_id", proposalId)
      .eq("user_id", userId)
      .single()

    if (existingVote) {
      throw new Error("You have already voted on this proposal")
    }

    // Map choice to vote value (0 = Against, 1 = For, 2 = Abstain)
    const voteValue = choice === "for" ? 1 : choice === "against" ? 0 : 2

    // Record vote in database
    const { error: insertError } = await supabase.from("votes").insert({
      proposal_id: proposalId,
      user_id: userId,
      vote: choice,
      vote_value: voteValue,
    })

    if (insertError) throw insertError

    // Send email confirmation
    try {
      const { data: voter } = await supabase
        .from("users")
        .select("email")
        .eq("user_id", userId)
        .single()

      const { data: proposal } = await supabase
        .from("proposals")
        .select("title, chamas(name)")
        .eq("proposal_id", proposalId)
        .single()

      if (voter && proposal) {
        const { sendEmail } = await import("@/lib/email")
        const { VoteConfirmationEmail } = await import("@/lib/email-templates")

        await sendEmail({
          to: voter.email,
          subject: `Vote Confirmed: ${proposal.title}`,
          react: VoteConfirmationEmail({
            proposalTitle: proposal.title,
            voteChoice: choice,
            chamaName: proposal.chamas?.name || "Chama",
          }),
        })
      }
    } catch (emailError) {
      console.error("Error sending vote confirmation email:", emailError)
      // Don't fail the vote if email fails
    }

    return { success: true }
  } catch (error: any) {
    console.error("Vote recording error:", error)
    throw new Error(error.message || "Failed to record vote")
  }
}

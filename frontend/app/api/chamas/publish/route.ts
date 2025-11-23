// app/api/chamas/publish/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase-server"
import { sendEmail } from "@/lib/email"
import { ChamaPublishedEmail } from "@/lib/email-templates"
import { encodeCreateChama, extractAddressesFromLogs } from "@/lib/blockchain-encoding"
import { CHAMA_FACTORY_ABI } from "@/lib/contract-abis"
import { createWalletClient, http, publicActions } from "viem"
import { baseSepolia } from "viem/chains"
import { privateKeyToAccount } from "viem/accounts"

export async function POST(request: NextRequest) {
    try {
        const { chamaId } = await request.json()

        if (!chamaId) {
            return NextResponse.json({ error: "Chama ID is required" }, { status: 400 })
        }

        const supabase = await getSupabaseServer()

        // Get Chama details
        const { data: chama, error: chamaError } = await supabase
            .from("chamas")
            .select("*")
            .eq("chama_id", chamaId)
            .single()

        if (chamaError || !chama) {
            console.error("Chama not found:", chamaError)
            return NextResponse.json({ error: "Chama not found" }, { status: 404 })
        }

        if (chama.status !== "draft") {
            return NextResponse.json({ error: "Chama is already published" }, { status: 400 })
        }

        // Get all accepted members with their wallet addresses
        const { data: members, error: membersError } = await supabase
            .from("chama_members")
            .select("user_id, users(email, first_name, wallet_address)")
            .eq("chama_id", chamaId)

        if (membersError || !members || members.length === 0) {
            console.error("Error fetching members:", membersError)
            return NextResponse.json({ error: "No members found for this Chama" }, { status: 400 })
        }

        // Extract wallet addresses (founders array)
        const founderAddresses = members
            .map((m: any) => m.users?.wallet_address)
            .filter((addr: string | null) => addr !== null) as string[]

        if (founderAddresses.length === 0) {
            return NextResponse.json({
                error: "No members have wallet addresses. Members must connect wallets before publishing."
            }, { status: 400 })
        }

        // Get constitution from metadata
        const constitution = chama.metadata?.constitution
        if (!constitution) {
            return NextResponse.json({ error: "Constitution not found" }, { status: 400 })
        }

        // Deploy Chama on-chain
        // Note: This requires a server-side wallet with funds for gas
        // You'll need to set DEPLOYER_PRIVATE_KEY in your environment
        const deployerPrivateKey = process.env.DEPLOYER_PRIVATE_KEY
        if (!deployerPrivateKey) {
            console.error("DEPLOYER_PRIVATE_KEY not set")
            return NextResponse.json({
                error: "Server configuration error: deployer wallet not configured"
            }, { status: 500 })
        }

        const account = privateKeyToAccount(deployerPrivateKey as `0x${string}`)
        const client = createWalletClient({
            account,
            chain: baseSepolia,
            transport: http()
        }).extend(publicActions)

        // Encode the createChama transaction
        const { to, data } = encodeCreateChama(
            constitution.chamaName,
            constitution.currency || "USDC",
            founderAddresses,
            founderAddresses[0] // First founder as bank observer (admin)
        )

        // Send transaction
        const txHash = await client.sendTransaction({
            to: to as `0x${string}`,
            data: data as `0x${string}`,
            chain: baseSepolia,
        })

        // Wait for transaction receipt
        const receipt = await client.waitForTransactionReceipt({ hash: txHash })

        // Extract governor and token addresses from logs
        const { governor, token } = extractAddressesFromLogs(
            receipt,
            CHAMA_FACTORY_ABI,
            "ChamaCreated"
        )

        // Update Chama status to published with blockchain details
        const { error: updateError } = await supabase
            .from("chamas")
            .update({
                status: "published",
                governor_address: governor,
                membership_token_address: token,
                on_chain_tx_hash: txHash,
                on_chain_published_at: new Date().toISOString()
            })
            .eq("chama_id", chamaId)

        if (updateError) {
            console.error("Error updating Chama status:", updateError)
            throw updateError
        }

        // Create constitution as first proposal
        const { error: proposalError } = await supabase
            .from('proposals')
            .insert({
                chama_id: chamaId,
                title: "Chama Constitution",
                description: `Vote to ratify the constitution for ${chama.name}`,
                proposal_type: "GOVERNANCE",
                ipfs_hash: chama.constitution_ipfs_cid,
                status: "pending",  // Will be activated when on-chain proposal is created
                creator_id: chama.creator_id,
            })

        if (proposalError) {
            console.error("Error creating constitution proposal:", proposalError)
            // Don't fail the whole publish process if proposal creation fails
        }

        // Send emails and notifications to all members
        if (members && members.length > 0) {
            for (const member of members) {
                try {
                    // Send email
                    if (member.users?.email) {
                        await sendEmail({
                            to: member.users.email,
                            subject: `${chama.name} is now live on-chain!`,
                            react: ChamaPublishedEmail({
                                chamaName: chama.name,
                                chamaId: chama.chama_id,
                            }),
                        })
                    }

                    // Create notification
                    await supabase.from("notifications").insert({
                        user_id: member.user_id,
                        title: `${chama.name} is now on-chain!`,
                        message: `The Chama has been published to the blockchain. You can now participate in proposals and contributions.`,
                        type: "success",
                        link: `/dashboard/chama/${chamaId}`,
                    })
                } catch (emailError) {
                    console.error(`Error notifying member ${member.user_id}:`, emailError)
                    // Don't fail the whole process if one notification fails
                }
            }
        }

        return NextResponse.json({
            success: true,
            txHash,
            governorAddress: governor,
            tokenAddress: token
        })
    } catch (error: any) {
        console.error("Error publishing Chama:", error)
        return NextResponse.json(
            { error: error.message || "Failed to publish Chama" },
            { status: 500 }
        )
    }
}

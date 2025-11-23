"use client"

import { useEffect, useState } from "react"
import { useEvmAddress } from "@coinbase/cdp-hooks"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getSupabaseClient } from "@/lib/supabase-client"
import { acceptChamaInvitation, declineChamaInvitation } from "@/app/actions/chama-publishing"
import { CheckCircle, XCircle, Clock } from "lucide-react"

interface PendingInvitation {
  chama_id: string
  chama_name: string
  creator_name: string
  constitution_ipfs_cid: string
  description: string
}

export function ChamaInvitations() {
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([])
  const [loading, setLoading] = useState(true)
  const { evmAddress } = useEvmAddress()

  useEffect(() => {
    const fetchInvitations = async () => {
      if (!evmAddress) return

      const supabase = getSupabaseClient()

      // Get user
      const { data: userData } = await supabase
        .from("users")
        .select("user_id")
        .eq("wallet_address", evmAddress)
        .single()

      if (!userData) return

      // Get pending invitations
      const { data: invitations } = await supabase
        .from("chama_members")
        .select("chama_id, chamas(name, description, creator_id, constitution_ipfs_cid, users(first_name, last_name))")
        .eq("user_id", userData.user_id)
        .eq("invitation_status", "pending")

      const formatted =
        invitations?.map((inv: any) => ({
          chama_id: inv.chama_id,
          chama_name: inv.chamas.name,
          creator_name: `${inv.chamas.users.first_name} ${inv.chamas.users.last_name}`,
          constitution_ipfs_cid: inv.chamas.constitution_ipfs_cid,
          description: inv.chamas.description,
        })) || []

      setPendingInvitations(formatted)
      setLoading(false)
    }

    fetchInvitations()
  }, [evmAddress])

  const handleAccept = async (chamaId: string, userId: string) => {
    await acceptChamaInvitation(chamaId, userId)
    setPendingInvitations((pending) => pending.filter((p) => p.chama_id !== chamaId))
  }

  const handleDecline = async (chamaId: string, userId: string) => {
    await declineChamaInvitation(chamaId, userId)
    setPendingInvitations((pending) => pending.filter((p) => p.chama_id !== chamaId))
  }

  if (loading) return <div>Loading invitations...</div>

  if (pendingInvitations.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold flex items-center gap-2">
        <Clock className="w-5 h-5" />
        Pending Invitations
      </h3>

      {pendingInvitations.map((inv) => (
        <Card key={inv.chama_id}>
          <CardHeader>
            <CardTitle className="text-lg">{inv.chama_name}</CardTitle>
            <CardDescription>Invited by {inv.creator_name}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{inv.description}</p>

            <a
              href={`https://ipfs.io/ipfs/${inv.constitution_ipfs_cid}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              📄 Read Constitution
            </a>

            <div className="flex gap-3">
              <Button onClick={() => handleAccept(inv.chama_id, "")} className="flex-1 gap-2">
                <CheckCircle className="w-4 h-4" />
                Accept
              </Button>
              <Button variant="destructive" onClick={() => handleDecline(inv.chama_id, "")} className="flex-1 gap-2">
                <XCircle className="w-4 h-4" />
                Decline
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}


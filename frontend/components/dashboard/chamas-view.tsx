// components/dashboard/chamas-view.tsx
"use client"

import { useEffect, useState } from "react"
import { useUser } from "@/lib/UserContext"
import { getSupabaseClient } from "@/lib/supabase-client"
import type { Chama, ChamaMember } from "@/lib/types"
import { toast } from "sonner"
import { Plus } from "lucide-react"

// Import our new table
import { ChamaTable } from "./chamas/ChamaTable"

// We can remove the modal components
// import { ChamasHeader } from "./chamas/ChamasHeader" // We'll inline this
import { CreateChamaModal } from "./chamas/CreateChamaModal"
// import { InviteMemberModal } from "./chamas/InviteMemberModal" // Removed
// import { ChamaDetailsModal } from "./chamas/ChamaDetailsModal" // Removed
// import { ChamaList } from "./chamas/ChamaList" // Removed

import { Button } from "@/components/ui/button"

export interface ChamaWithMembers extends Chama {
  memberCount?: number
  userRole?: string
  creatorName?: string
  memberDetails?: (ChamaMember & { users: { first_name: string; last_name: string; email: string } })[]
}

export function ChamasView() {
  const { user, isLoading: isUserLoading } = useUser()
  const [chamas, setChamas] = useState<ChamaWithMembers[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateFlow, setShowCreateFlow] = useState(false)

  const supabase = getSupabaseClient()

  useEffect(() => {
    if (isUserLoading || !user) return
    fetchChamas()
  }, [user, isUserLoading])

  const fetchChamas = async () => {
    if (!user) return
    setLoading(true)

    const { data: memberData } = await supabase
      .from("chama_members")
      .select("*")
      .eq("user_id", user.user_id)
    const memberMap = memberData?.reduce((acc, m) => ({ ...acc, [m.chama_id]: m }), {}) || {}

    // Fetch only PUBLISHED chamas for general viewing
    const { data: chamasData } = await supabase
      .from("chamas")
      .select("*")
      .eq("is_active", true)
      .eq("status", "published")  // Only published chamas

    if (chamasData) {
      const chamasWithDetails = await Promise.all(
        chamasData.map(async (chama) => {
          const { count } = await supabase
            .from("chama_members")
            .select("*", { count: "exact", head: true })
            .eq("chama_id", chama.chama_id)

          // You can remove other fetches if they are only for the detail modal
          return {
            ...chama,
            memberCount: count || 0,
            userRole: memberMap[chama.chama_id]?.role,
          } as ChamaWithMembers
        })
      )
      setChamas(chamasWithDetails)
    }
    setLoading(false)
  }

  const handleCreateComplete = () => {
    setShowCreateFlow(false)
    toast.success("Chama created successfully!")
    fetchChamas() // Re-fetch all chamas
  }

  const handleJoinChama = async (chamaId: string) => {
    if (!user) return
    const promise = supabase.from("chama_members").insert({
      chama_id: chamaId,
      user_id: user.user_id,
      role: "member",
      voting_power: 1,
    });

    toast.promise(promise, {
      loading: "Joining chama...",
      success: () => {
        fetchChamas() // Refresh list on success
        return "Successfully joined chama!"
      },
      error: (err) => `Failed to join: ${err.message}`
    })
  };

  const handleLeaveChama = async (chamaId: string) => {
    if (!user) return
    const promise = supabase
      .from("chama_members")
      .delete()
      .eq("chama_id", chamaId)
      .eq("user_id", user.user_id);

    toast.promise(promise, {
      loading: "Leaving chama...",
      success: () => {
        fetchChamas() // Refresh list on success
        return "Successfully left chama."
      },
      error: (err) => `Failed to leave: ${err.message}`
    })
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Chamas</h1>
          <p className="text-muted-foreground">Join or create a new group</p>
        </div>
        <Button onClick={() => setShowCreateFlow(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Create
        </Button>
      </div>

      <CreateChamaModal
        isOpen={showCreateFlow}
        onClose={() => setShowCreateFlow(false)}
        onComplete={handleCreateComplete}
      />

      {isUserLoading || loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading chamas...</div>
      ) : (
        <ChamaTable
          chamas={chamas}
          onJoin={handleJoinChama}
          onLeave={handleLeaveChama}
        />
      )}
    </div>
  )
}

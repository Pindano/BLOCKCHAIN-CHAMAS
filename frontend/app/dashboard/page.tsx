// app/dashboard/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useIsSignedIn, useEvmAddress } from "@coinbase/cdp-hooks"
import { usePathname, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getSupabaseClient } from "@/lib/supabase-client"
import { Home, Users, Vote, User as UserIcon, Menu, LogOut } from "lucide-react"
import Sidebar from "@/components/dashboard/sidebar"


export default function Dashboard() {
  const { isSignedIn } = useIsSignedIn()
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [chamas, setChamas] = useState<any[]>([]) // Adjust type as needed
  const [stats, setStats] = useState({ totalChamas: 0, totalProposals: 0 }) // Example stats
  const { evmAddress } = useEvmAddress()
  useEffect(() => {
    if (!isSignedIn) {
      router.push("/auth")
      return
    }

    const fetchData = async () => {
      const supabase = getSupabaseClient()
      const { data: session } = await supabase.auth.getSession()
      const walletAddress = evmAddress
      if (!walletAddress) return

      const { data: userData } = await supabase
        .from("users")
        .select("user_id")
        .eq("wallet_address", walletAddress)
        .single()

      if (!userData) return
      setUserId(userData.user_id)

      const { data: memberData } = await supabase
        .from("chama_members")
        .select("chama_id")
        .eq("user_id", userData.user_id)

      const chamaIds = memberData?.map((m) => m.chama_id) || []
      const { data: chamasData } = await supabase.from("chamas").select("*").in("chama_id", chamaIds)
      setChamas(chamasData || [])

      const { count: proposalCount } = await supabase
        .from("proposals")
        .select("*", { count: "exact", head: true })
        .in("chama_id", chamaIds)

      setStats({ totalChamas: chamaIds.length, totalProposals: proposalCount || 0 })
    }

    fetchData()
  }, [isSignedIn, router])

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-background">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>My Chamas</CardTitle>
              <CardDescription>Groups you are part of</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold">{stats.totalChamas}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Active Proposals</CardTitle>
              <CardDescription>Proposals you can vote on</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold">{stats.totalProposals}</p>
            </CardContent>
          </Card>
        </div>
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Your Chamas</h2>
          {chamas.length === 0 ? (
            <p className="text-muted-foreground">No chamas joined yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {chamas.map((chama) => (
                <Card key={chama.chama_id}>
                  <CardHeader>
                    <CardTitle>{chama.name}</CardTitle>
                    <CardDescription>{chama.investment_type}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{chama.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

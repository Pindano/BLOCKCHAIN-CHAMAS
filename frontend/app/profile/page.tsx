// app/profile/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useIsSignedIn, useEvmAddress } from "@coinbase/cdp-hooks"
import { usePathname, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getSupabaseClient } from "@/lib/supabase-client"
import type { User } from "@/lib/types"
import { Home, Users, Vote, User as UserIcon, Menu, LogOut } from "lucide-react"
import Sidebar from "@/components/dashboard/sidebar"


export default function Profile() {
  const [user, setUser] = useState<User | null>(null)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState<Partial<User>>({})
  const { isSignedIn } = useIsSignedIn()
  const router = useRouter()
const { evmAddress } = useEvmAddress()

  useEffect(() => {
    if (!isSignedIn) {
      router.push("/auth")
      return
    }

    const fetchUser = async () => {
      const supabase = getSupabaseClient()
      const { data: session } = await supabase.auth.getSession()
      const walletAddress = evmAddress
      if (!walletAddress) return

      const { data, error } = await supabase.from("users").select("*").eq("wallet_address", walletAddress).single()
      if (error) {
        console.error("Error fetching user:", error)
      } else {
        setUser(data)
        setFormData(data)
      }
    }

    fetchUser()
  }, [isSignedIn, router])

  const handleSave = async () => {
    if (!user) return

    const supabase = getSupabaseClient()
    const { error } = await supabase.from("users").update(formData).eq("user_id", user.user_id)

    if (error) {
      console.error("Error updating profile:", error)
    } else {
      setUser({ ...user, ...formData })
      setEditing(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-background">
        <div className="max-w-2xl mx-auto">
          {user ? (
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>Manage your account information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">First Name</label>
                    <Input
                      value={formData.first_name || ""}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      disabled={!editing}
                      placeholder="Enter first name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Last Name</label>
                    <Input
                      value={formData.last_name || ""}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      disabled={!editing}
                      placeholder="Enter last name"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input value={user.email} disabled />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone Number</label>
                  <Input
                    value={formData.phone_number || ""}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    disabled={!editing}
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Bio</label>
                  <textarea
                    className="w-full px-3 py-2 border border-input rounded-md"
                    value={formData.bio || ""}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    disabled={!editing}
                    rows={4}
                    placeholder="Tell us about yourself"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Wallet Address</label>
                  <Input value={user.wallet_address} disabled />
                </div>
                <div className="flex gap-4">
                  {!editing ? (
                    <Button onClick={() => setEditing(true)}>Edit Profile</Button>
                  ) : (
                    <>
                      <Button onClick={handleSave}>Save Changes</Button>
                      <Button variant="outline" onClick={() => setEditing(false)}>
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">User not found</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

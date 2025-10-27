"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useEvmAddress } from "@coinbase/cdp-hooks"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase-client"

export default function ProfilePage() {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [idNumber, setIdNumber] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [walletReady, setWalletReady] = useState(false)
  const { evmAddress } = useEvmAddress()
  const router = useRouter()

  useEffect(() => {
    const storedEmail = sessionStorage.getItem("email")
    console.log("[v0] Profile page loaded, email:", storedEmail)
    if (!storedEmail) {
      console.log("[v0] No email found, redirecting to auth")
      router.push("/auth")
    } else {
      setEmail(storedEmail)
    }
  }, [router])

  useEffect(() => {
    console.log("[v0] EVM Address:", evmAddress)
    if (evmAddress) {
      setWalletReady(true)
    }
  }, [evmAddress])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (!evmAddress) {
        throw new Error("Wallet not ready. Please try again.")
      }

      if (!email) {
        throw new Error("Email not found. Please sign up again.")
      }

      console.log("[v0] Creating user with:", {
        email,
        wallet_address: evmAddress,
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNumber,
        id_number: idNumber,
      })

      const supabase = getSupabaseClient()

      const { data, error: insertError } = await supabase
        .from("users")
        .insert({
          email,
          wallet_address: evmAddress,
          first_name: firstName,
          last_name: lastName,
          phone_number: phoneNumber,
          id_number: idNumber,
        })
        .select()

      console.log("[v0] Insert result:", { data, insertError })

      if (insertError) {
        console.error("[v0] Insert error details:", insertError)
        throw insertError
      }

      console.log("[v0] User created successfully:", data)

      // Clear session storage and redirect to dashboard
      sessionStorage.removeItem("email")
      router.push("/dashboard")
    } catch (err) {
      console.error("[v0] Profile creation error:", err)
      setError(err instanceof Error ? err.message : "Failed to create profile")
    } finally {
      setLoading(false)
    }
  }

  if (!email) {
    return <div className="min-h-screen bg-background" />
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-lg">
          <CardHeader className="space-y-2">
            <CardTitle>Complete Your Profile</CardTitle>
            <CardDescription>Add your details to get started</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="firstName" className="text-sm font-medium">
                    First Name
                  </label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="lastName" className="text-sm font-medium">
                    Last Name
                  </label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium">
                  Phone Number
                </label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+254712345678"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="id" className="text-sm font-medium">
                  ID Number
                </label>
                <Input
                  id="id"
                  placeholder="12345678"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">{error}</div>}
              <Button type="submit" className="w-full" disabled={loading || !walletReady}>
                {loading ? "Creating Profile..." : walletReady ? "Complete Setup" : "Wallet Loading..."}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}


"use client"

import type React from "react"

import { useState } from "react"
import { useEvmAddress } from "@coinbase/cdp-hooks"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getSupabaseClient } from "@/lib/supabase-client"

interface ProfileStepProps {
  email: string
}

export function ProfileStep({ email }: ProfileStepProps) {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [idNumber, setIdNumber] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { evmAddress } = useEvmAddress()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (!evmAddress) {
        throw new Error("Wallet not ready")
      }

      const supabase = getSupabaseClient()
      const { error: insertError } = await supabase.from("users").insert({
        email,
        wallet_address: evmAddress,
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNumber,
        id_number: idNumber,
      })

      if (insertError) throw insertError

      // Redirect to dashboard
      window.location.href = "/dashboard"
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create profile")
    } finally {
      setLoading(false)
    }
  }

  return (
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
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating Profile..." : "Complete Setup"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

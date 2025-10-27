"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useVerifyEmailOTP } from "@coinbase/cdp-hooks"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase-client"

export default function VerifyPage() {
  const [otp, setOtp] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [flowId, setFlowId] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const { verifyEmailOTP } = useVerifyEmailOTP()
  const router = useRouter()

  useEffect(() => {
    const storedFlowId = sessionStorage.getItem("flowId")
    const storedEmail = sessionStorage.getItem("email")
    if (!storedFlowId || !storedEmail) {
      router.push("/auth")
    } else {
      setFlowId(storedFlowId)
      setEmail(storedEmail)
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!flowId || !email) return

    setError(null)
    setLoading(true)

    try {
      console.log("[v0] Verifying OTP for email:", email)
      await verifyEmailOTP({ flowId, otp })
      console.log("[v0] OTP verified successfully")

      const supabase = getSupabaseClient()

      const { data: existingUser, error: queryError } = await supabase
        .from("users")
        .select("user_id")
        .eq("email", email)
        .single()

      console.log("[v0] User query result:", { existingUser, queryError })

      if (queryError && queryError.code !== "PGRST116") {
        // PGRST116 means no rows found, which is expected for new users
        console.error("[v0] Query error:", queryError)
        throw queryError
      }

      // Clear session storage
      sessionStorage.removeItem("flowId")
      sessionStorage.removeItem("isSignUp")

      if (existingUser) {
        console.log("[v0] Existing user found, redirecting to dashboard")
        sessionStorage.removeItem("email")
        router.push("/dashboard")
      } else {
        console.log("[v0] New user, redirecting to profile setup")
        // Keep email in sessionStorage for profile page
        router.push("/auth/profile")
      }
    } catch (err) {
      console.error("[v0] OTP verification error:", err)
      setError(err instanceof Error ? err.message : "Failed to verify OTP")
    } finally {
      setLoading(false)
    }
  }

  if (!flowId || !email) {
    return <div className="min-h-screen bg-background" />
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-lg">
          <CardHeader className="space-y-2">
            <CardTitle>Verify Your Email</CardTitle>
            <CardDescription>Enter the OTP sent to {email}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="otp" className="text-sm font-medium">
                  One-Time Password
                </label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  maxLength={6}
                  required
                  disabled={loading}
                />
              </div>
              {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">{error}</div>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Verifying..." : "Verify OTP"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}


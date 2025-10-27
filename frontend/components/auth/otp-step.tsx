"use client"

import type React from "react"

import { useState } from "react"
import { useVerifyEmailOTP } from "@coinbase/cdp-hooks"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface OtpStepProps {
  flowId: string
  email: string
  onSubmit: () => void
}

export function OtpStep({ flowId, email, onSubmit }: OtpStepProps) {
  const [otp, setOtp] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { verifyEmailOTP } = useVerifyEmailOTP()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await verifyEmailOTP({ flowId, otp })
      onSubmit()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to verify OTP")
    } finally {
      setLoading(false)
    }
  }

  return (
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
  )
}

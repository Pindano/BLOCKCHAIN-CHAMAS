"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useSignInWithEmail, useIsSignedIn } from "@coinbase/cdp-hooks"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"

export default function AuthPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSignUp, setIsSignUp] = useState(false)
  const { signInWithEmail } = useSignInWithEmail()
  const { isSignedIn } = useIsSignedIn()
  const router = useRouter()

  useEffect(() => {
    if (isSignedIn) {
      router.push("/dashboard")
    }
  }, [isSignedIn, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (!process.env.NEXT_PUBLIC_CDP_PROJECT_ID) {
        throw new Error("Wallet service not configured. Please contact support.")
      }

      const result = await signInWithEmail({ email })
      // Store flowId, email, and signup flag in sessionStorage
      sessionStorage.setItem("flowId", result.flowId)
      sessionStorage.setItem("email", email)
      sessionStorage.setItem("isSignUp", isSignUp.toString())
      router.push("/auth/verify")
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to send OTP"
      if (errorMessage.includes("already authenticated")) {
        setError("You are already signed in. Redirecting to dashboard...")
        setTimeout(() => router.push("/dashboard"), 2000)
      } else {
        setError(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-lg">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl">Welcome to Chama DAO</CardTitle>
            <CardDescription>{isSignUp ? "Create your account" : "Sign in to your account"}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">{error}</div>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending OTP..." : "Send OTP"}
              </Button>
              <div className="text-sm text-center text-muted-foreground">
                {isSignUp ? (
                  <>
                    Already have an account?{" "}
                    <button type="button" onClick={() => setIsSignUp(false)} className="text-primary hover:underline">
                      Sign in
                    </button>
                  </>
                ) : (
                  <>
                    Don't have an account?{" "}
                    <button type="button" onClick={() => setIsSignUp(true)} className="text-primary hover:underline">
                      Sign up
                    </button>
                  </>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

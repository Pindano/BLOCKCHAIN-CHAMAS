"use client"

import { useEffect } from "react"
import { useIsSignedIn } from "@coinbase/cdp-hooks"
import { useRouter } from "next/navigation"

export default function Home() {
  const { isSignedIn } = useIsSignedIn()
  const router = useRouter()

  useEffect(() => {
    if (isSignedIn) {
      router.push("/dashboard")
    } else {
      router.push("/auth")
    }
  }, [isSignedIn, router])

  return <div className="min-h-screen bg-background" />
}

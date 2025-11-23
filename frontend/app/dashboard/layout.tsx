"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@/lib/UserContext"
import { Loader2 } from "lucide-react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isSynced, isLoading, isConnected } = useUser()
  const router = useRouter()

  useEffect(() => {
    // Give it a small delay or check if initialization is complete
    if (!isLoading) {
      if (!isConnected) {
        router.push("/auth")
      } else if (isConnected && !isSynced) {
        router.push("/auth")
      }
    }
  }, [isLoading, isConnected, isSynced, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--kente-orange)]" />
      </div>
    )
  }

  // Prevent flash of content while redirecting
  if (!isConnected || !isSynced) {
    return null
  }

  return <>{children}</>
}

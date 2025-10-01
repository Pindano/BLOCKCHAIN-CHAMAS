import type React from "react"
import type { Metadata } from "next"


import { Suspense } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: "Chama DAO - Cooperative Investment Platform",
  description: "Join our decentralized autonomous cooperative for community-driven investments",
  
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <Suspense fallback={null}>{children}</Suspense>
        
      </body>
    </html>
  )
}

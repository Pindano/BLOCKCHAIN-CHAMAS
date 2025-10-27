"use client"

import { CDPReactProvider } from "@coinbase/cdp-react"
import type React from "react"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CDPReactProvider
      config={{
        projectId: process.env.NEXT_PUBLIC_CDP_PROJECT_ID || "",
        ethereum: {
          createOnLogin: "eoa",
        },
        appName: "Chama DAO",
      }}
    >
      {children}
    </CDPReactProvider>
  )
}

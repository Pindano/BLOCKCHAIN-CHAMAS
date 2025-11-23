"use client"

import { CDPReactProvider } from "@coinbase/cdp-react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { http } from "viem"
import { baseSepolia, base } from 'viem/chains'
import { WagmiProvider, createConfig } from 'wagmi'
import { createCDPEmbeddedWalletConnector } from "@coinbase/cdp-wagmi"
import React from "react"
import { UserProvider } from "@/lib/UserContext"

const projectId = process.env.NEXT_PUBLIC_CDP_PROJECT_ID || ""

// Create QueryClient outside component to avoid recreation
const queryClient = new QueryClient()

// Create CDP connector and wagmi config outside component
const cdpConnector = createCDPEmbeddedWalletConnector({
  cdpConfig: {
    projectId: projectId,
  },
  providerConfig: {
    chains: [baseSepolia, base],
    transports: {
      [baseSepolia.id]: http(),
      [base.id]: http(),
    },
    announceProvider: true,
  },
})

const wagmiConfig = createConfig({
  chains: [base, baseSepolia],
  connectors: [cdpConnector],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
})

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CDPReactProvider
      config={{
        projectId: projectId,
        ethereum: {
          createOnLogin: "eoa",
        },
        appName: "Chama DAO",
      }}
    >
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <UserProvider>
            {children}
          </UserProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </CDPReactProvider>
  )
}

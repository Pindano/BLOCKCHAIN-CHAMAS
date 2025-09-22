"use client"

import { useEffect } from "react"
import { useEvmAddress } from "@coinbase/cdp-hooks"
import { AuthButton } from "@coinbase/cdp-react/components/AuthButton"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Wallet, CheckCircle } from "lucide-react"

interface WalletCreationStepProps {
  onWalletCreated: (address: string) => void
  onNext: () => void
}

export function WalletCreationStep({ onWalletCreated, onNext }: WalletCreationStepProps) {
  const { evmAddress } = useEvmAddress()

  // Check if user is authenticated by checking if we have an evmAddress
  const isAuthenticated = !!evmAddress

  useEffect(() => {
    if (isAuthenticated && evmAddress) {
      onWalletCreated(evmAddress)
    }
  }, [isAuthenticated, evmAddress, onWalletCreated])

  const handleContinue = () => {
    if (isAuthenticated && evmAddress) {
      onNext()
    }
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Create Your Wallet</h2>
        <p className="text-muted-foreground">Connect your Coinbase wallet to join the Chama DAO community</p>
      </div>

      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Wallet className="w-6 h-6 text-primary" />
          </div>
          <CardTitle>Coinbase Wallet</CardTitle>
          <CardDescription>Secure, decentralized wallet for your Chama DAO membership</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isAuthenticated && evmAddress && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Wallet connected successfully!
                <br />
                <span className="font-mono text-sm break-all">{evmAddress}</span>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            {!isAuthenticated ? (
              <div className="w-full justify-center items-center">
                <AuthButton />
              </div>
            ) : (
              <Button onClick={handleContinue} className="w-full" size="lg">
                Continue to Member Information
              </Button>
            )}
          </div>

            
        </CardContent>
      </Card>
    </div>
  )
}
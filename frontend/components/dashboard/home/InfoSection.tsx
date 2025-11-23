// components/dashboard/home/InfoSection.tsx
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function InfoSection() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>Quick tips to get the most out of Chama DAO</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">1. Join or Create a Chama</h4>
            <p className="text-sm text-muted-foreground">
              Browse available chamas or create your own group for savings and investments.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium">2. Participate in Proposals</h4>
            <p className="text-sm text-muted-foreground">
              Vote on important decisions affecting your chama's future.
</p>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium">3. Manage Your Profile</h4>
            <p className="text-sm text-muted-foreground">
              Keep your profile updated with accurate information and a profile picture.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About Chama DAO</CardTitle>
          <CardDescription>Decentralized group management</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            Chama DAO is a decentralized platform for managing rotating savings and credit associations (chamas) using
            blockchain technology.
          </p>
          <p>Each member has voting power to participate in decisions about loans, distributions, and investments.</p>
          <p>Your wallet is your identity, ensuring security and transparency in all transactions and decisions.</p>
        </CardContent>
      </Card>
    </div>
  )
}

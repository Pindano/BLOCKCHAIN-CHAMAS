"use client"

import { useState, useEffect } from "react"
import { useEvmAddress } from "@coinbase/cdp-hooks"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Wallet, User, ArrowRight, Copy, Check } from "lucide-react"
import { getChamaDaoDatabase, type Member } from "@/lib/supabase-client"

interface CompletionStepProps {
  walletAddress: string
  memberInfo: {
    fullName: string
    email: string
    phoneNumber: string
    location: string
    investmentExperience: string
    monthlyContribution: string
    investmentGoals: string
    riskTolerance: string
  }
}

export function CompletionStep({ walletAddress, memberInfo }: CompletionStepProps) {
  const { evmAddress } = useEvmAddress()
  const currentWalletAddress = evmAddress || walletAddress

  const [member, setMember] = useState<Member | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const fetchMemberData = async () => {
      try {
        const db = getChamaDaoDatabase()
        const { data, error } = await db.getMemberByWalletAddress(currentWalletAddress)

        if (error) {
          console.error("Error fetching member data:", error)
        } else {
          setMember(data)
        }
      } catch (error) {
        console.error("Error fetching member data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMemberData()
  }, [currentWalletAddress])

  const copyWalletAddress = async () => {
    try {
      await navigator.clipboard.writeText(currentWalletAddress)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy wallet address:", error)
    }
  }

  const getRiskToleranceColor = (riskTolerance: string) => {
    switch (riskTolerance) {
      case "conservative":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "moderate":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "aggressive":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getExperienceColor = (experience: string) => {
    switch (experience) {
      case "beginner":
        return "bg-green-100 text-green-800 border-green-200"
      case "intermediate":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "experienced":
        return "bg-purple-100 text-purple-800 border-purple-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Loading your member profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-3xl font-bold text-foreground">Welcome to Chama DAO!</h2>
        <p className="text-lg text-muted-foreground">
          Your registration is complete. You're now part of our decentralized cooperative investment community.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Member Profile
          </CardTitle>
          <CardDescription>Your membership details and investment preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Full Name:</span>
                <p className="font-medium">{memberInfo.fullName}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Email:</span>
                <p className="font-medium">{memberInfo.email}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Phone:</span>
                <p className="font-medium">{memberInfo.phoneNumber}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Location:</span>
                <p className="font-medium">{memberInfo.location}</p>
              </div>
            </div>
          </div>

          {/* Investment Profile */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">Investment Profile</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className={getExperienceColor(memberInfo.investmentExperience)}>
                {memberInfo.investmentExperience.charAt(0).toUpperCase() + memberInfo.investmentExperience.slice(1)}{" "}
                Investor
              </Badge>
              <Badge variant="outline" className={getRiskToleranceColor(memberInfo.riskTolerance)}>
                {memberInfo.riskTolerance.charAt(0).toUpperCase() + memberInfo.riskTolerance.slice(1)} Risk
              </Badge>
              <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-200">
                ${memberInfo.monthlyContribution}/month
              </Badge>
            </div>
            {memberInfo.investmentGoals && (
              <div>
                <span className="text-muted-foreground text-sm">Investment Goals:</span>
                <p className="text-sm mt-1 p-3 bg-muted/50 rounded-md">{memberInfo.investmentGoals}</p>
              </div>
            )}
          </div>

          {/* Wallet Information */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              Connected Wallet
            </h3>
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
              <code className="text-xs font-mono flex-1 break-all">{currentWalletAddress}</code>
              <Button variant="ghost" size="sm" onClick={copyWalletAddress} className="shrink-0">
                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Member Status */}
          {member && (
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground">Membership Status</h3>
              <div className="flex items-center justify-between p-3 bg-primary/5 rounded-md border border-primary/20">
                <div>
                  <p className="font-medium text-primary">Active Member</p>
                  <p className="text-xs text-muted-foreground">
                    Joined {new Date(member.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Badge className="bg-primary text-primary-foreground">ID: {member.id.slice(0, 8)}...</Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
          <CardDescription>Get started with your Chama DAO membership</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs font-medium text-primary">1</span>
              </div>
              <div>
                <h4 className="font-medium">Explore Investment Opportunities</h4>
                <p className="text-sm text-muted-foreground">
                  Browse available investment pools and join discussions with other members.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs font-medium text-primary">2</span>
              </div>
              <div>
                <h4 className="font-medium">Make Your First Contribution</h4>
                <p className="text-sm text-muted-foreground">
                  Start contributing to investment pools based on your monthly commitment.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs font-medium text-primary">3</span>
              </div>
              <div>
                <h4 className="font-medium">Connect with the Community</h4>
                <p className="text-sm text-muted-foreground">
                  Join our Discord server and participate in governance decisions.
                </p>
              </div>
            </div>
          </div>

          <Button className="w-full" size="lg">
            Go to Dashboard
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

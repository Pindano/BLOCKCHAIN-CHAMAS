"use client"

import type React from "react"

import { useState } from "react"
import { useEvmAddress } from "@coinbase/cdp-hooks"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, User, ArrowLeft, ArrowRight, AlertCircle } from "lucide-react"
import { getChamaDaoDatabase } from "@/lib/supabase-client"

interface MemberInfo {
  fullName: string
  email: string
  phoneNumber: string
  location: string
  investmentExperience: string
  monthlyContribution: string
  investmentGoals: string
  riskTolerance: string
}

interface MemberInformationStepProps {
  walletAddress: string
  onMemberInfoSubmitted: (memberInfo: MemberInfo) => void
  onNext: () => void
  onBack: () => void
}

export function MemberInformationStep({
  walletAddress,
  onMemberInfoSubmitted,
  onNext,
  onBack,
}: MemberInformationStepProps) {
  const { evmAddress } = useEvmAddress()
  const currentWalletAddress = evmAddress || walletAddress

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string>("")
  const [memberInfo, setMemberInfo] = useState<MemberInfo>({
    fullName: "",
    email: "",
    phoneNumber: "",
    location: "",
    investmentExperience: "",
    monthlyContribution: "",
    investmentGoals: "",
    riskTolerance: "",
  })

  const handleInputChange = (field: keyof MemberInfo, value: string) => {
    setMemberInfo((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const validateForm = (): boolean => {
    const requiredFields: (keyof MemberInfo)[] = [
      "fullName",
      "email",
      "phoneNumber",
      "location",
      "investmentExperience",
      "monthlyContribution",
      "riskTolerance",
    ]

    for (const field of requiredFields) {
      if (!memberInfo[field].trim()) {
        setError(`Please fill in your ${field.replace(/([A-Z])/g, " $1").toLowerCase()}`)
        return false
      }
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(memberInfo.email)) {
      setError("Please enter a valid email address")
      return false
    }

    // Phone validation (basic)
    const phoneRegex = /^[+]?[1-9][\d]{0,15}$/
    if (!phoneRegex.test(memberInfo.phoneNumber.replace(/\s/g, ""))) {
      setError("Please enter a valid phone number")
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const db = getChamaDaoDatabase()

      const { data: member, error: memberError } = await db.createMember({
        wallet_address: currentWalletAddress,
        full_name: memberInfo.fullName,
        email: memberInfo.email,
        phone_number: memberInfo.phoneNumber,
        location: memberInfo.location,
        investment_experience: memberInfo.investmentExperience as "beginner" | "intermediate" | "experienced",
        monthly_contribution: memberInfo.monthlyContribution,
        investment_goals: memberInfo.investmentGoals || null,
        risk_tolerance: memberInfo.riskTolerance as "conservative" | "moderate" | "aggressive",
      })

      if (memberError) {
        throw new Error(memberError.message || "Failed to create member record")
      }

      // Create wallet connection record
      if (member) {
        const { error: connectionError } = await db.createWalletConnection({
          member_id: member.id,
          wallet_address: currentWalletAddress,
          connection_type: "coinbase",
          is_active: true,
          metadata: {},
        })

        if (connectionError) {
          console.warn("Failed to create wallet connection record:", connectionError)
        }
      }

      onMemberInfoSubmitted(memberInfo)
      onNext()
    } catch (err: any) {
      console.error("Member registration error:", err)
      setError(err.message || "Failed to submit member information")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Member Information</h2>
        <p className="text-muted-foreground">Tell us about yourself to complete your Chama DAO membership</p>
      </div>

      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <User className="w-6 h-6 text-primary" />
          </div>
          <CardTitle>Personal & Investment Details</CardTitle>
          <CardDescription>
            Connected wallet: <span className="font-mono text-xs break-all">{currentWalletAddress}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Personal Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    value={memberInfo.fullName}
                    onChange={(e) => handleInputChange("fullName", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={memberInfo.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number *</Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    placeholder="+254 700 000 000"
                    value={memberInfo.phoneNumber}
                    onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    type="text"
                    placeholder="City, Country"
                    value={memberInfo.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Investment Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Investment Profile</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="investmentExperience">Investment Experience *</Label>
                  <Select
                    value={memberInfo.investmentExperience}
                    onValueChange={(value) => handleInputChange("investmentExperience", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your experience level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner (0-1 years)</SelectItem>
                      <SelectItem value="intermediate">Intermediate (2-5 years)</SelectItem>
                      <SelectItem value="experienced">Experienced (5+ years)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="monthlyContribution">Monthly Contribution (USD) *</Label>
                  <Select
                    value={memberInfo.monthlyContribution}
                    onValueChange={(value) => handleInputChange("monthlyContribution", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select contribution range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="50-100">$50 - $100</SelectItem>
                      <SelectItem value="100-250">$100 - $250</SelectItem>
                      <SelectItem value="250-500">$250 - $500</SelectItem>
                      <SelectItem value="500-1000">$500 - $1,000</SelectItem>
                      <SelectItem value="1000+">$1,000+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="riskTolerance">Risk Tolerance *</Label>
                <Select
                  value={memberInfo.riskTolerance}
                  onValueChange={(value) => handleInputChange("riskTolerance", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your risk tolerance" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conservative">Conservative - Prefer stable, low-risk investments</SelectItem>
                    <SelectItem value="moderate">Moderate - Balanced approach to risk and return</SelectItem>
                    <SelectItem value="aggressive">
                      Aggressive - Comfortable with high-risk, high-reward investments
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="investmentGoals">Investment Goals (Optional)</Label>
                <Textarea
                  id="investmentGoals"
                  placeholder="Describe your investment goals and what you hope to achieve with Chama DAO..."
                  value={memberInfo.investmentGoals}
                  onChange={(e) => handleInputChange("investmentGoals", e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onBack} className="flex-1 bg-transparent">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Wallet
              </Button>

              <Button type="submit" disabled={isSubmitting} className="flex-1" size="lg">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Complete Registration
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

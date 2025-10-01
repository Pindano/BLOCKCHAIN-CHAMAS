 "use client"

import { useState } from "react"
import { useIsInitialized } from "@coinbase/cdp-hooks"
import { LoadingSkeleton } from "@coinbase/cdp-react/components/ui/LoadingSkeleton"
import { ProgressIndicator } from "@/components/progress-indicator"
import { WalletCreationStep } from "@/components/wallet-creation-step"
import { MemberInformationStep } from "@/components/member-information-step"
import { CompletionStep } from "@/components/completion-step"

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

const ONBOARDING_STEPS = [
  {
    id: 1,
    title: "Create Wallet",
    description: "Connect your Coinbase wallet",
  },
  {
    id: 2,
    title: "Member Info",
    description: "Provide your details",
  }
]

export function ChamaOnboardingApp() {
  const { isInitialized } = useIsInitialized()
  

  const [currentStep, setCurrentStep] = useState(1)
  const [walletAddress, setWalletAddress] = useState<string>("")
  const [memberInfo, setMemberInfo] = useState<MemberInfo | null>(null)

  const handleWalletCreated = (address: string) => {
    setWalletAddress(address)
  }

  const handleMemberInfoSubmitted = (info: MemberInfo) => {
    setMemberInfo(info)
  }

  const handleNextStep = () => {
    setCurrentStep((prev) => Math.min(prev + 1, ONBOARDING_STEPS.length))
  }

  const handlePreviousStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSkeleton />
      </div>
    )
  }


  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4 text-balance">Welcome to Chama DAO</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Join our DAO platform. Start by creating your wallet and providing your
            member information.
          </p>
        </div>

        <ProgressIndicator steps={ONBOARDING_STEPS} currentStep={currentStep} />

        <div className="flex justify-center">
          {currentStep === 1 && <WalletCreationStep onWalletCreated={handleWalletCreated} onNext={handleNextStep} />}
          {currentStep === 2 && (
            <MemberInformationStep
              walletAddress={walletAddress}
              onMemberInfoSubmitted={handleMemberInfoSubmitted}
              onNext={handleNextStep}
              onBack={handlePreviousStep}
            />
          )}
          {currentStep === 3 && memberInfo && <CompletionStep walletAddress={walletAddress} memberInfo={memberInfo} />}
        </div>
      </div>
    </div>
  )
}

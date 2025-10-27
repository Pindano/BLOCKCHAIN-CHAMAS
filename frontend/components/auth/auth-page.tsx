"use client"

import { useState } from "react"
import { EmailStep } from "./email-step"
import { OtpStep } from "./otp-step"
import { ProfileStep } from "./profile-step"

type AuthStep = "email" | "otp" | "profile"

export function AuthPage() {
  const [step, setStep] = useState<AuthStep>("email")
  const [flowId, setFlowId] = useState<string | null>(null)
  const [email, setEmail] = useState<string>("")

  const handleEmailSubmit = (newFlowId: string, newEmail: string) => {
    setFlowId(newFlowId)
    setEmail(newEmail)
    setStep("otp")
  }

  const handleOtpSubmit = () => {
    setStep("profile")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="w-full max-w-md">
        {step === "email" && <EmailStep onSubmit={handleEmailSubmit} />}
        {step === "otp" && flowId && <OtpStep flowId={flowId} email={email} onSubmit={handleOtpSubmit} />}
        {step === "profile" && email && <ProfileStep email={email} />}
      </div>
    </div>
  )
}

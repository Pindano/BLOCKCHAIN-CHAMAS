"use client"

import Providers from "@/components/providers"
import { ChamaOnboardingApp } from "@/components/chama-onboarding-app"

export default function Home() {
  return (
    <Providers>
      <ChamaOnboardingApp />
    </Providers>
  )
}

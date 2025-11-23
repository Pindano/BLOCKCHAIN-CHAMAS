"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Search, Users, TrendingUp, Shield, Wallet, Globe, Heart } from "lucide-react"

// Mock data for Chamas
const MOCK_CHAMAS = [
  {
    id: 1,
    name: "Nairobi Women's Circle",
    country: "Kenya",
    flag: "🇰🇪",
    potSize: "KES 5,840,000",
    members: 24,
    nextPayout: "Dec 12, 2025",
    nextRecipient: "Mercy Achieng",
    isPublic: true,
    pattern: "kitenge-orange"
  },
  {
    id: 2,
    name: "Lagos Tech Savers",
    country: "Nigeria",
    flag: "🇳🇬",
    potSize: "₦ 12,450,000",
    members: 18,
    nextPayout: "Dec 20, 2025",
    nextRecipient: "Chioma Okafor",
    isPublic: true,
    pattern: "ankara-teal"
  },
  {
    id: 3,
    name: "Accra Entrepreneurs Fund",
    country: "Ghana",
    flag: "🇬🇭",
    potSize: "GH₵ 85,600",
    members: 32,
    nextPayout: "Jan 5, 2026",
    nextRecipient: "Kwame Mensah",
    isPublic: true,
    pattern: "adinkra-gold"
  },
  {
    id: 4,
    name: "Mombasa Traders Chama",
    country: "Kenya",
    flag: "🇰🇪",
    potSize: "KES 3,200,000",
    members: 15,
    nextPayout: "Dec 28, 2025",
    nextRecipient: "Hassan Ali",
    isPublic: false,
    pattern: "terracotta"
  },
  {
    id: 5,
    name: "Abuja Family Circle",
    country: "Nigeria",
    flag: "🇳🇬",
    potSize: "₦ 8,900,000",
    members: 20,
    nextPayout: "Jan 10, 2026",
    nextRecipient: "Amina Bello",
    isPublic: true,
    pattern: "kitenge-orange"
  },
  {
    id: 6,
    name: "Kumasi Market Women",
    country: "Ghana",
    flag: "🇬🇭",
    potSize: "GH₵ 125,000",
    members: 40,
    nextPayout: "Dec 15, 2025",
    nextRecipient: "Ama Asante",
    isPublic: true,
    pattern: "ankara-teal"
  }
]

export default function LandingPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCountry, setSelectedCountry] = useState("all")

  const filteredChamas = MOCK_CHAMAS.filter(chama => {
    const matchesSearch = chama.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chama.country.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = selectedCountry === "all" ||
      chama.country.toLowerCase() === selectedCountry.toLowerCase()
    return matchesSearch && matchesFilter
  })

  return (
    <>
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <div className="space-y-4">
          <h1 className="text-5xl md:text-7xl font-heading font-bold tracking-tight">
            Save with people
            <span className="block gradient-text mt-2">you trust</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            Join thousands building wealth together through traditional Chamas, powered by modern technology.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            onClick={() => router.push("/dashboard")}
            className="gap-2 text-lg px-8 py-6"
          >
            Start or Join a Chama
            <ArrowRight className="w-5 h-5" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => router.push("/dashboard")}
            className="text-lg px-8 py-6"
          >
            Learn More
          </Button>
        </div>

        {/* Trust Indicators */}

      </div>

      {/* Search & Filter Section */}


      {/* Features Section */}
      < section className="border-t bg-muted/30 py-24" >
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-center mb-16">
              Why Choose ChamaDao?
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <FeatureCard
                icon={<Users className="w-10 h-10" />}
                title="Democratic Governance"
                description="Every member has a voice. Vote on proposals and shape your Chama's future."
              />
              <FeatureCard
                icon={<Shield className="w-10 h-10" />}
                title="Transparent & Secure"
                description="All contributions tracked on-chain. No hidden fees, no surprises."
              />
              <FeatureCard
                icon={<TrendingUp className="w-10 h-10" />}
                title="Track Growth"
                description="Real-time dashboards showing your savings, contributions, and payouts."
              />
              <FeatureCard
                icon={<Wallet className="w-10 h-10" />}
                title="Easy Payments"
                description="Contribute via mobile money, card, or crypto. Simple and seamless."
              />
            </div>
          </div>
        </div>
      </section >

      {/* CTA Section */}
      < section className="py-24" >
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8 p-12 rounded-2xl bg-gradient-to-br from-[var(--kente-orange)] to-[var(--ankara-teal)] text-white">
            <h2 className="text-3xl md:text-5xl font-heading font-bold">
              Ready to start saving together?
            </h2>
            <p className="text-xl opacity-90">
              Join a Chama or create your own in minutes. No complicated setup required.
            </p>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => router.push("/dashboard")}
              className="gap-2 text-lg px-8 py-6"
            >
              Get Started Now
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </section >

      {/* Footer */}
      < footer className="border-t py-12 bg-muted/20" >
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--kente-orange)] to-[var(--ankara-teal)] flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-heading font-bold">ChamaDao</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 ChamaDao. Building wealth together across Africa.
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Heart className="w-4 h-4 text-[var(--kente-orange)]" />
              <span>Made with love in Africa</span>
            </div>
          </div>
        </div>
      </footer >
    </>

  )
}

function ChamaCard({ chama, onClick }: { chama: typeof MOCK_CHAMAS[0], onClick: () => void }) {
  const patternColors = {
    "kitenge-orange": "from-[var(--kente-orange)]/20 to-[var(--kente-orange)]/5",
    "ankara-teal": "from-[var(--ankara-teal)]/20 to-[var(--ankara-teal)]/5",
    "adinkra-gold": "from-[var(--adinkra-gold)]/20 to-[var(--adinkra-gold)]/5",
    "terracotta": "from-[var(--terracotta)]/20 to-[var(--terracotta)]/5"
  }

  return (
    <Card
      className="smooth-hover cursor-pointer overflow-hidden group"
      onClick={onClick}
    >
      <div className={`h-2 bg-gradient-to-r ${patternColors[chama.pattern as keyof typeof patternColors]}`} />
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl mb-2 group-hover:text-[var(--kente-orange)] transition-colors">
              {chama.name}
            </CardTitle>
            <CardDescription className="flex items-center gap-2">
              <span className="text-2xl">{chama.flag}</span>
              <span>{chama.country}</span>
              {chama.isPublic ? (
                <Badge variant="secondary" className="ml-2">Public</Badge>
              ) : (
                <Badge variant="outline" className="ml-2">Private</Badge>
              )}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Current Pot</span>
            <span className="text-2xl font-bold text-[var(--kente-orange)]">{chama.potSize}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Members</span>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="font-semibold">{chama.members}</span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t space-y-1">
          <p className="text-sm text-muted-foreground">Next Payout</p>
          <p className="font-semibold">{chama.nextPayout}</p>
          <p className="text-sm text-[var(--ankara-teal)] flex items-center gap-1">
            <span>👑</span>
            <span>{chama.nextRecipient}</span>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="text-center space-y-4">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--kente-orange)]/10 to-[var(--ankara-teal)]/10 text-[var(--kente-orange)]">
        {icon}
      </div>
      <h3 className="font-heading font-semibold text-xl">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  )
}

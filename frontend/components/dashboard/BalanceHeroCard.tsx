// components/dashboard/BalanceHeroCard.tsx
"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, TrendingUp, Wallet } from "lucide-react"
import Link from "next/link"

interface BalanceHeroCardProps {
    totalContributions: number
    loanBalance?: number
    currency?: string
    trend?: string
}

export function BalanceHeroCard({ totalContributions, loanBalance = 0, currency = "KES", trend }: BalanceHeroCardProps) {
    return (
        <Card className="relative overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-950 dark:to-gray-900 text-white border-0">
            {/* Decorative circle */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />

            <div className="relative p-6 space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Total Balance */}
                    <div>
                        <p className="text-sm text-gray-300">Total balance</p>
                        <h2 className="text-4xl font-bold mt-1">
                            {currency} {totalContributions.toLocaleString()}
                        </h2>

                    </div>

                    {/* Loan Balance */}
                    <div>
                        <p className="text-sm text-gray-300 flex items-center gap-2">
                            <Wallet className="w-4 h-4" />
                            Outstanding loans
                        </p>
                        <h3 className="text-3xl font-bold mt-1">
                            {currency} {loanBalance.toLocaleString()}
                        </h3>
                        <p className="text-sm text-gray-400 mt-2">
                            Amount borrowed - repaid
                        </p>
                    </div>
                </div>


            </div>
        </Card>
    )
}

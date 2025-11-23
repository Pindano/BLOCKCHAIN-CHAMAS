"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

interface LoanRequestFormProps {
  chamaId: string
  onSubmit: (data: any) => Promise<void>
  isLoading?: boolean
}

export function LoanRequestForm({ chamaId, onSubmit, isLoading }: LoanRequestFormProps) {
  const [formData, setFormData] = useState({
    amount: 0,
    currency: "KES",
    purpose: "",
    repaymentPeriod: 12,
    interestRate: 5,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
    setFormData({ amount: 0, currency: "KES", purpose: "", repaymentPeriod: 12, interestRate: 5 })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Request Loan</CardTitle>
        <CardDescription>Submit a loan request for chama approval</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Currency</label>
              <select
                className="w-full px-3 py-2 border border-input rounded-md"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              >
                <option value="KES">KES</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Loan Purpose</label>
            <textarea
              placeholder="Describe what the loan will be used for..."
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-input rounded-md"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Repayment Period (months)</label>
              <Input
                type="number"
                min="1"
                value={formData.repaymentPeriod}
                onChange={(e) => setFormData({ ...formData, repaymentPeriod: Number(e.target.value) })}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Interest Rate (%)</label>
              <Input
                type="number"
                min="0"
                step="0.1"
                value={formData.interestRate}
                onChange={(e) => setFormData({ ...formData, interestRate: Number(e.target.value) })}
                required
              />
            </div>
          </div>
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Loan Request
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}


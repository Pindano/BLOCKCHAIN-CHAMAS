"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

interface ContributionFormProps {
  chamaId: string
  memberName: string
  onSubmit: (data: any) => Promise<void>
  isLoading?: boolean
}

export function ContributionForm({ chamaId, memberName, onSubmit, isLoading }: ContributionFormProps) {
  const [formData, setFormData] = useState({
    amount: 0,
    currency: "KES",
    period: new Date().toISOString().slice(0, 7),
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
    setFormData({ amount: 0, currency: "KES", period: new Date().toISOString().slice(0, 7) })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Record Member Contribution</CardTitle>
        <CardDescription>Log {memberName}'s monthly contribution</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Contribution Amount</label>
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
          <div className="space-y-2">
            <label className="text-sm font-medium">Period</label>
            <Input
              type="month"
              value={formData.period}
              onChange={(e) => setFormData({ ...formData, period: e.target.value })}
              required
            />
          </div>
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Record Contribution
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}


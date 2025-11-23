"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

interface AddMemberFormProps {
  chamaId: string
  onSubmit: (data: any) => Promise<void>
  isLoading?: boolean
}

export function AddMemberForm({ chamaId, onSubmit, isLoading }: AddMemberFormProps) {
  const [formData, setFormData] = useState({
    memberEmail: "",
    memberName: "",
    votingPower: 1,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
    setFormData({ memberEmail: "", memberName: "", votingPower: 1 })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Member to Chama</CardTitle>
        <CardDescription>Propose a new member to join the chama</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Member Email</label>
            <Input
              type="email"
              placeholder="member@example.com"
              value={formData.memberEmail}
              onChange={(e) => setFormData({ ...formData, memberEmail: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Member Name</label>
            <Input
              placeholder="Full name"
              value={formData.memberName}
              onChange={(e) => setFormData({ ...formData, memberName: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Voting Power</label>
            <Input
              type="number"
              min="1"
              value={formData.votingPower}
              onChange={(e) => setFormData({ ...formData, votingPower: Number(e.target.value) })}
              required
            />
          </div>
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Propose Member Addition
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}


"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

interface ConstitutionEditFormProps {
  chamaId: string
  onSubmit: (data: any) => Promise<void>
  isLoading?: boolean
}

export function ConstitutionEditForm({ chamaId, onSubmit, isLoading }: ConstitutionEditFormProps) {
  const [formData, setFormData] = useState({
    sectionTitle: "",
    oldContent: "",
    newContent: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
    setFormData({ sectionTitle: "", oldContent: "", newContent: "" })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Propose Constitution Edit</CardTitle>
        <CardDescription>Suggest changes to the chama's constitution</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Section Title</label>
            <Input
              placeholder="e.g., Membership Dues"
              value={formData.sectionTitle}
              onChange={(e) => setFormData({ ...formData, sectionTitle: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Current Content</label>
            <textarea
              placeholder="Current constitutional text..."
              value={formData.oldContent}
              onChange={(e) => setFormData({ ...formData, oldContent: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-input rounded-md"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Proposed Content</label>
            <textarea
              placeholder="New constitutional text..."
              value={formData.newContent}
              onChange={(e) => setFormData({ ...formData, newContent: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-input rounded-md"
              required
            />
          </div>
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Constitution Edit
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}


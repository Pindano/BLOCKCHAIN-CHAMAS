// components/dashboard/chamas/InviteMemberModal.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Mail, X } from "lucide-react"

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  onEmailChange: (email: string) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

export function InviteMemberModal({ isOpen, onClose, email, onEmailChange, onSubmit }: InviteMemberModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Mail className="w-5 h-5" />
            Invite Member
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Member Email</label>
              <Input
                type="email"
                placeholder="member@example.com"
                value={email}
                onChange={(e) => onEmailChange(e.target.value)}
                required
              />
            </div>
            <div className="flex gap-4">
              <Button type="submit">Send Invite</Button>
              <Button variant="outline" type="button" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

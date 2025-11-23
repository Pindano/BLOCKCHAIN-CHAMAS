// components/dashboard/chamas/ChamaDetailsModal.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import type { ChamaWithMembers } from "../chamas-view"; // Import the type from the parent

interface ChamaDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  chama: ChamaWithMembers | undefined;
}

export function ChamaDetailsModal({ isOpen, onClose, chama }: ChamaDetailsModalProps) {
  if (!isOpen || !chama) return null;

  const progress = chama.target_amount ? Math.min(100, ((chama.current_amount || 0) / chama.target_amount) * 100) : 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>{chama.name} - Details</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Creator</p>
                <p className="font-semibold">{chama.creatorName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Investment Type</p>
                <p className="font-semibold">{chama.investment_type || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Currency</p>
                <p className="font-semibold">{chama.currency}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-semibold">{chama.is_active ? "Active" : "Inactive"}</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">Description</p>
              <p className="text-sm">{chama.description || "No description"}</p>
            </div>

            {chama.target_amount && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Financial Progress</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{chama.current_amount} / {chama.target_amount} {chama.currency}</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              </div>
            )}

            <div>
              <p className="text-sm text-muted-foreground mb-3">Members ({chama.memberCount})</p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {chama.memberDetails?.map((member) => (
                  <div key={member.chama_member_id} className="flex justify-between items-center p-2 bg-muted rounded">
                    <div>
                      <p className="text-sm font-medium">
                        {member.users?.first_name} {member.users?.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">{member.users?.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold capitalize">{member.role}</p>
                      <p className="text-xs text-muted-foreground">VP: {member.voting_power}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

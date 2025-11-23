// components/dashboard/chamas/ChamaCard.tsx
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ChamaWithMembers } from "../chamas-view";
import { Users, LogOut, Mail, TrendingUp, DollarSign, Calendar, Tag } from "lucide-react";

interface ChamaCardProps {
  chama: ChamaWithMembers;
  onJoin: (chamaId: string) => void;
  onLeave: (chamaId: string) => void;
  onInvite: (chamaId: string) => void;
  onViewDetails: (chamaId: string) => void;
}

export function ChamaCard({ chama, onJoin, onLeave, onInvite, onViewDetails }: ChamaCardProps) {
  const progress = chama.target_amount ? Math.min(100, ((chama.current_amount || 0) / chama.target_amount) * 100) : 0;

  return (
    <Card className={chama.userRole ? "border-primary" : ""}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{chama.name}</CardTitle>
            <CardDescription>{chama.investment_type}</CardDescription>
          </div>
          {chama.userRole && (
            <span className="text-xs font-semibold bg-primary text-primary-foreground px-2 py-1 rounded">
              {chama.userRole}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2 h-10">{chama.description}</p>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Tag className="w-4 h-4" />
            <span>Creator: {chama.creatorName}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>Created: {new Date(chama.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        {chama.target_amount && (
          <div className="text-sm">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <TrendingUp className="w-4 h-4" />
              <span>Progress</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 mt-1">
              <div className="bg-primary h-2 rounded-full" style={{ width: `${progress}%` }} />
            </div>
            <div className="flex items-center gap-2 text-xs mt-1 text-muted-foreground">
              <DollarSign className="w-3 h-3" />
              <span>{chama.current_amount} / {chama.target_amount} {chama.currency}</span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="w-4 h-4" />
          <span>{chama.memberCount} members</span>
        </div>

        <div className="flex gap-2 flex-wrap">
          {chama.userRole ? (
            <>
              <Button size="sm" variant="outline" onClick={() => onViewDetails(chama.chama_id)} className="flex-1">
                View Details
              </Button>
              <Button size="sm" variant="outline" onClick={() => onInvite(chama.chama_id)} className="gap-2">
                <Mail className="w-4 h-4" />
                Invite
              </Button>
              <Button size="sm" variant="destructive" onClick={() => onLeave(chama.chama_id)} className="gap-2">
                <LogOut className="w-4 h-4" />
                Leave
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={() => onJoin(chama.chama_id)} className="w-full">
              Join Chama
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

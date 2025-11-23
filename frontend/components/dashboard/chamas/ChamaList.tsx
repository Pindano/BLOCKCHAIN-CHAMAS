// components/dashboard/chamas/ChamaList.tsx
"use client"

import { Button } from "@/components/ui/button";
import type { ChamaWithMembers } from "../chamas-view";
import { ChamaCard } from "./ChamaCard"; // Imports the card we'll make next

interface ChamaListProps {
  chamas: ChamaWithMembers[];
  onJoin: (chamaId: string) => void;
  onLeave: (chamaId: string) => void;
  onInvite: (chamaId: string) => void;
  onViewDetails: (chamaId: string) => void;
  onCreate: () => void;
}

export function ChamaList({
  chamas,
  onJoin,
  onLeave,
  onInvite,
  onViewDetails,
  onCreate,
}: ChamaListProps) {
  if (chamas.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">No chamas available yet</p>
        <Button onClick={onCreate}>Create the first chama</Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {chamas.map((chama) => (
        <ChamaCard
          key={chama.chama_id}
          chama={chama}
          onJoin={onJoin}
          onLeave={onLeave}
          onInvite={onInvite}
          onViewDetails={onViewDetails}
        />
      ))}
    </div>
  );
}

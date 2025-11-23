// components/dashboard/chamas/ChamasHeader.tsx
"use client"

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface ChamasHeaderProps {
  onCreate: () => void;
}

export function ChamasHeader({ onCreate }: ChamasHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-8">
      <div>
        <h1 className="text-3xl font-bold">Chamas</h1>
        <p className="text-muted-foreground">Manage your groups and memberships</p>
      </div>
      <Button onClick={onCreate} className="gap-2">
        <Plus className="w-4 h-4" />
        Create Chama
      </Button>
    </div>
  );
}

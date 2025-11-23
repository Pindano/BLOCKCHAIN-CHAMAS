// components/dashboard/chamas/CreateChamaModal.tsx
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreateChamaFlow } from "../create-chama-flow"; // Assumes flow is one level up
import { X } from "lucide-react";

interface CreateChamaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function CreateChamaModal({ isOpen, onClose, onComplete }: CreateChamaModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Create New Chama</CardTitle>
            <CardDescription>Multi-step chama creation with constitution</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <CreateChamaFlow onComplete={onComplete} />
        </CardContent>
      </Card>
    </div>
  );
}

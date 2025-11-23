// components/dashboard/home/ChamaListHome.tsx
"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import type { ChamaWithMembers } from "../chamas-view"

interface ChamaListHomeProps {
  chamas: ChamaWithMembers[]
  onJoin: (chamaId: string) => Promise<void>
  onLeave: (chamaId: string) => Promise<void>
}

export function ChamaListHome({ chamas, onJoin, onLeave }: ChamaListHomeProps) {
  const router = useRouter()

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Your Chamas</h2>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => router.push('/dashboard/chama')}
        >
          View All
        </Button>
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="text-center">Members</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {chamas.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  You're not in any chamas yet.
                </TableCell>
              </TableRow>
            )}
            {chamas.slice(0, 5).map((chama) => (
              <TableRow key={chama.chama_id}>
                <TableCell>
                  <div className="font-medium">{chama.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{chama.description}</div>
                </TableCell>
                <TableCell className="text-center">{chama.memberCount}</TableCell>
                <TableCell className="text-right">
                  {chama.userRole ? (
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => onLeave(chama.chama_id)}
                    >
                      Leave
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onJoin(chama.chama_id)}
                    >
                      Join
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Button 
        variant="outline"
        className="w-full mt-4"
        onClick={() => router.push('/dashboard/chama')} // Or link to create chama
      >
        Join or Create a Chama
      </Button>
    </div>
  )
}

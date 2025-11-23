// components/dashboard/chamas/ChamaTable.tsx
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

interface ChamaTableProps {
  chamas: ChamaWithMembers[]
  onJoin: (chamaId: string) => Promise<void>
  onLeave: (chamaId: string) => Promise<void>
}

export function ChamaTable({ chamas, onJoin, onLeave }: ChamaTableProps) {
  const router = useRouter()

  const handleRowClick = (chamaId: string) => {
    router.push(`/dashboard/chama/${chamaId}`)
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Chama</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {chamas.length === 0 && (
            <TableRow>
              <TableCell colSpan={2} className="text-center text-muted-foreground">
                No chamas found.
              </TableCell>
            </TableRow>
          )}
          {chamas.map((chama) => (
            <TableRow key={chama.chama_id}>
              <TableCell 
                className="cursor-pointer" 
                onClick={() => handleRowClick(chama.chama_id)}
              >
                <div className="font-medium">{chama.name}</div>
                <div className="text-xs text-muted-foreground">
                  {chama.memberCount} {chama.memberCount === 1 ? "member" : "members"}
                </div>
              </TableCell>
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
  )
}

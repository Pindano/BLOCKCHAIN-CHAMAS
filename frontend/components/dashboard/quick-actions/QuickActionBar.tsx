// components/dashboard/quick-actions/QuickActionBar.tsx
"use client"

import { Button } from "@/components/ui/button"
import { Plus, Users, FileText } from "lucide-react"
import Link from "next/link"

export function QuickActionBar() {
    return (
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
            <div className="container flex items-center gap-4 py-3">
                <Link href="/dashboard/proposals">
                    <Button size="lg" className="gap-2 shadow-lg">
                        <Plus className="w-5 h-5" />
                        <span className="hidden sm:inline">New Proposal</span>
                    </Button>
                </Link>
                <Link href="/dashboard/chamas">
                    <Button variant="outline" size="lg" className="gap-2">
                        <Users className="w-5 h-5" />
                        <span className="hidden sm:inline">Chamas</span>
                    </Button>
                </Link>
                <Link href="/dashboard/proposals">
                    <Button variant="outline" size="lg" className="gap-2">
                        <FileText className="w-5 h-5" />
                        <span className="hidden sm:inline">Proposals</span>
                    </Button>
                </Link>
            </div>
        </div>
    )
}

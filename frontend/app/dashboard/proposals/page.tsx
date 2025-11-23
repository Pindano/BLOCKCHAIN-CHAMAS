// app/dashboard/proposals/page.tsx
"use client"
import { ProposalsView } from "@/components/dashboard/proposals-view"

// Auth guard is handled by layout.tsx
export default function ProposalsPage() {
  // ProposalsView will fetch its own data
  return <ProposalsView />
}

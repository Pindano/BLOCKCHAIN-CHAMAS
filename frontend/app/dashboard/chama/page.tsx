// app/dashboard/chama/page.tsx
"use client"
import { ChamasView } from "@/components/dashboard/chamas-view"

// Auth guard is handled by layout.tsx
export default function ChamasPage() {
  // ChamasView will fetch its own data
  return <ChamasView />
}

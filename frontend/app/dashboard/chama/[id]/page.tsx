// app/dashboard/chama/[id]/page.tsx
"use client"

import { ChamaDetailView } from "@/components/dashboard/chamas/ChamaDetailView"

// 1. Remove params from here
export default function ChamaDetailPage() {
  
  // 2. Just render the component. It will get the ID itself.
  return <ChamaDetailView />
}

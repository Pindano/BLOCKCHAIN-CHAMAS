// app/dashboard/loans/[id]/page.tsx
import { LoanDetailView } from "@/components/dashboard/loans/LoanDetailView"

export default function LoanDetailPage({ params }: { params: { id: string } }) {
    return <LoanDetailView loanId={params.id} />
}

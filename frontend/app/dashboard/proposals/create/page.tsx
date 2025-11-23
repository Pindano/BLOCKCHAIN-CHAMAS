"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import {
    ArrowLeft,
    DollarSign,
    GraduationCap,
    UserPlus,
    AlertTriangle,
    RefreshCw,
    FileText,
    Eye
} from "lucide-react"
import { decodeEventLog } from 'viem'
import { useChamaGovernor } from "@/hooks/useChamaGovernor"
import { useUser } from "@/lib/UserContext"
import { uploadProposalToIPFS } from "@/app/actions/ipfs"
import { supabase } from "@/lib/supabase"
import { CHAMA_GOVERNOR_ABI } from "@/lib/contract-abis"

// Placeholder - in a real app this would come from context or URL
const GOVERNOR_ADDRESS = "0x0000000000000000000000000000000000000000"

type ProposalType =
    | "contribution-change"
    | "loan-request"
    | "add-member"
    | "remove-member"
    | "emergency-payout"
    | "change-payout-order"
    | "edit-constitution"

const PROPOSAL_TYPES = [
    {
        id: "contribution-change" as ProposalType,
        name: "Contribution Change",
        icon: DollarSign,
        description: "Propose a change to monthly contribution amount",
        color: "text-[var(--kente-orange)]"
    },
    {
        id: "loan-request" as ProposalType,
        name: "Loan Request",
        icon: GraduationCap,
        description: "Request a loan from the Chama treasury",
        color: "text-[var(--ankara-teal)]"
    },
    {
        id: "add-member" as ProposalType,
        name: "Add Member",
        icon: UserPlus,
        description: "Propose adding a new member to the Chama",
        color: "text-[var(--adinkra-gold)]"
    },
    {
        id: "remove-member" as ProposalType,
        name: "Remove Member",
        icon: UserPlus,
        description: "Propose removing a member from the Chama",
        color: "text-[var(--terracotta)]"
    },
    {
        id: "emergency-payout" as ProposalType,
        name: "Emergency Payout",
        icon: AlertTriangle,
        description: "Request an emergency payout outside normal cycle",
        color: "text-red-600"
    },
    {
        id: "change-payout-order" as ProposalType,
        name: "Change Payout Order",
        icon: RefreshCw,
        description: "Modify the payout rotation order",
        color: "text-[var(--ankara-teal)]"
    },
    {
        id: "edit-constitution" as ProposalType,
        name: "Edit Constitution",
        icon: FileText,
        description: "Propose changes to Chama rules and guidelines",
        color: "text-[var(--kente-orange)]"
    }
]

export default function CreateProposalPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const chamaId = searchParams.get("chamaId")
    const { address, user } = useUser() // Get user for creator_id
    const [governorAddress, setGovernorAddress] = useState<string | null>(null)
    const [chamaName, setChamaName] = useState<string>("")

    const [selectedType, setSelectedType] = useState<ProposalType | null>(null)
    const [showPreview, setShowPreview] = useState(false)
    const [formData, setFormData] = useState<any>({})
    const [isUploading, setIsUploading] = useState(false)
    const [publishedIpfsHash, setPublishedIpfsHash] = useState<string | null>(null)

    // Fetch chama details including governor address
    useEffect(() => {
        if (!chamaId) return;

        const fetchChamaDetails = async () => {
            try {
                const { data, error } = await supabase
                    .from('chamas')
                    .select('governor_address, name')
                    .eq('chama_id', chamaId)
                    .single();

                if (error) throw error;

                setGovernorAddress(data.governor_address);
                setChamaName(data.name);
            } catch (err) {
                console.error("Error fetching chama details:", err);
            }
        };

        fetchChamaDetails();
    }, [chamaId]);

    const { propose, isPending, isConfirming, isSuccess, receipt } = useChamaGovernor(governorAddress as `0x${string}`)

    const handlePublish = async () => {
        if (!selectedType) return
        setIsUploading(true)
        try {
            // 1. Upload metadata
            const metadata = {
                type: selectedType,
                ...formData,
                createdAt: new Date().toISOString()
            }
            const ipfsHash = await uploadProposalToIPFS(metadata)
            setPublishedIpfsHash(ipfsHash)

            // 2. Propose
            // For MVP we use empty arrays for execution targets. 
            // In production these would be encoded function calls.
            // IMPORTANT: Pass the full description string, not just the hash
            // The Governor contract will hash it internally
            const description = `ipfs://${ipfsHash}`
            await propose([governorAddress as `0x${string}`], [BigInt(0)], ["0x"], description)

        } catch (err) {
            console.error("Error creating proposal:", err)
            setIsUploading(false)
        }
    }

    useEffect(() => {
        if (isSuccess && receipt && publishedIpfsHash) {
            const syncToSupabase = async () => {
                try {
                    // Find ProposalCreated event
                    const event = receipt.logs.find(log => {
                        try {
                            const decoded = decodeEventLog({
                                abi: CHAMA_GOVERNOR_ABI,
                                data: log.data,
                                topics: log.topics
                            })
                            return decoded.eventName === 'ProposalCreated'
                        } catch {
                            return false
                        }
                    })

                    if (event) {
                        const decoded = decodeEventLog({
                            abi: CHAMA_GOVERNOR_ABI,
                            data: event.data,
                            topics: event.topics
                        })
                        // @ts-ignore
                        const proposalId = decoded.args.proposalId.toString()

                        // Insert into Supabase
                        const { error } = await supabase.from('proposals').insert({
                            on_chain_proposal_id: proposalId,
                            ipfs_hash: publishedIpfsHash,
                            chama_id: chamaId, // Use actual chamaId from URL
                            creator_id: user?.user_id || "", // Use user_id, not wallet address
                            title: formData.title || formData.reason || formData.purpose || "Untitled Proposal",
                            description: formData.reason || formData.purpose || formData.description || "No description",
                            status: "Active",
                            created_at: new Date().toISOString(),
                            voting_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
                            proposal_type: selectedType
                        })

                        if (error) {
                            console.error("Supabase error:", error)
                        } else {
                            console.log("Proposal saved to database successfully!")
                        }
                    }
                } catch (err) {
                    console.error("Error syncing to Supabase:", err)
                }

                router.push("/dashboard?success=proposal-created")
            }
            syncToSupabase()
        }
    }, [isSuccess, receipt, publishedIpfsHash, router, formData, selectedType])

    const isLoading = isUploading || isPending || isConfirming

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard")}>
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-heading font-bold">Create Proposal</h1>
                            <p className="text-sm text-muted-foreground">Nairobi Women's Circle</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => setShowPreview(!showPreview)} className="gap-2">
                            <Eye className="w-4 h-4" />
                            {showPreview ? "Edit" : "Preview"}
                        </Button>
                        <Button className="gap-2" onClick={handlePublish} disabled={!selectedType || isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Publishing...
                                </>
                            ) : (
                                "Publish Proposal"
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                <div className="grid lg:grid-cols-4 gap-6">
                    {/* Left Sidebar - Proposal Types */}
                    <div className="lg:col-span-1">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Proposal Type</CardTitle>
                                <CardDescription>Select what you want to propose</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {PROPOSAL_TYPES.map((type) => {
                                    const Icon = type.icon
                                    const isSelected = selectedType === type.id
                                    return (
                                        <button
                                            key={type.id}
                                            onClick={() => setSelectedType(type.id)}
                                            className={`w-full text-left p-3 rounded-lg border-2 transition-all ${isSelected
                                                ? 'border-[var(--kente-orange)] bg-[var(--kente-orange)]/5'
                                                : 'border-transparent hover:border-border hover:bg-muted/50'
                                                }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <Icon className={`w-5 h-5 mt-0.5 ${type.color}`} />
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-sm">{type.name}</p>
                                                    <p className="text-xs text-muted-foreground mt-1">{type.description}</p>
                                                </div>
                                            </div>
                                        </button>
                                    )
                                })}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Content Area */}
                    <div className="lg:col-span-3">
                        {!selectedType ? (
                            <Card className="h-full flex items-center justify-center min-h-[500px]">
                                <CardContent className="text-center space-y-4">
                                    <div className="w-16 h-16 rounded-full bg-muted mx-auto flex items-center justify-center">
                                        <FileText className="w-8 h-8 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg mb-2">Select a Proposal Type</h3>
                                        <p className="text-muted-foreground">
                                            Choose a proposal type from the sidebar to get started
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : showPreview ? (
                            <ProposalPreview type={selectedType} data={formData} />
                        ) : (
                            <ProposalForm type={selectedType} data={formData} onChange={setFormData} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

function ProposalForm({ type, data, onChange }: { type: ProposalType, data: any, onChange: (data: any) => void }) {
    const typeConfig = PROPOSAL_TYPES.find(t => t.id === type)!
    const Icon = typeConfig.icon

    const update = (field: string, value: any) => {
        onChange({ ...data, [field]: value })
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--kente-orange)]/10 to-[var(--ankara-teal)]/10 flex items-center justify-center ${typeConfig.color}`}>
                        <Icon className="w-6 h-6" />
                    </div>
                    <div>
                        <CardTitle>{typeConfig.name}</CardTitle>
                        <CardDescription>{typeConfig.description}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {type === "contribution-change" && <ContributionChangeForm data={data} update={update} />}
                {type === "loan-request" && <LoanRequestForm data={data} update={update} />}
                {type === "add-member" && <AddMemberForm data={data} update={update} />}
                {type === "remove-member" && <RemoveMemberForm data={data} update={update} />}
                {type === "emergency-payout" && <EmergencyPayoutForm data={data} update={update} />}
                {type === "change-payout-order" && <ChangePayoutOrderForm data={data} update={update} />}
                {type === "edit-constitution" && <EditConstitutionForm data={data} update={update} />}
            </CardContent>
        </Card>
    )
}

function ContributionChangeForm({ data, update }: any) {
    return (
        <div className="space-y-4">
            <div>
                <Label htmlFor="current">Current Monthly Contribution</Label>
                <Input id="current" value="KES 50,000" disabled className="mt-2" />
            </div>
            <div>
                <Label htmlFor="new">New Monthly Contribution</Label>
                <Input
                    id="new"
                    placeholder="KES 75,000"
                    className="mt-2"
                    value={data.newAmount || ""}
                    onChange={(e) => update("newAmount", e.target.value)}
                />
            </div>
            <div>
                <Label htmlFor="effective">Effective Date</Label>
                <Input
                    id="effective"
                    type="date"
                    className="mt-2"
                    value={data.effectiveDate || ""}
                    onChange={(e) => update("effectiveDate", e.target.value)}
                />
            </div>
            <div>
                <Label htmlFor="reason">Reason for Change</Label>
                <Textarea
                    id="reason"
                    placeholder="Explain why this change is needed..."
                    className="mt-2 min-h-[120px]"
                    value={data.reason || ""}
                    onChange={(e) => update("reason", e.target.value)}
                />
            </div>
        </div>
    )
}

function LoanRequestForm({ data, update }: any) {
    return (
        <div className="space-y-4">
            <div>
                <Label htmlFor="amount">Loan Amount</Label>
                <Input
                    id="amount"
                    placeholder="KES 150,000"
                    className="mt-2"
                    value={data.amount || ""}
                    onChange={(e) => update("amount", e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">Maximum: KES 150,000 (3x your contribution)</p>
            </div>
            <div>
                <Label htmlFor="purpose">Purpose of Loan</Label>
                <Textarea
                    id="purpose"
                    placeholder="School fees for my daughter's university..."
                    className="mt-2 min-h-[120px]"
                    value={data.purpose || ""}
                    onChange={(e) => update("purpose", e.target.value)}
                />
            </div>
            <div>
                <Label htmlFor="repayment">Repayment Plan</Label>
                <Textarea
                    id="repayment"
                    placeholder="I will repay KES 25,000 monthly for 6 months..."
                    className="mt-2 min-h-[80px]"
                    value={data.repayment || ""}
                    onChange={(e) => update("repayment", e.target.value)}
                />
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm font-semibold mb-2">Loan Terms</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Interest rate: 5% total</li>
                    <li>• Repayment period: Maximum 6 months</li>
                    <li>• Total repayment: KES 157,500</li>
                </ul>
            </div>
        </div>
    )
}

function AddMemberForm({ data, update }: any) {
    return (
        <div className="space-y-4">
            <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                    id="name"
                    placeholder="John Doe"
                    className="mt-2"
                    value={data.name || ""}
                    onChange={(e) => update("name", e.target.value)}
                />
            </div>
            <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                    id="phone"
                    placeholder="+254 700 000 000"
                    className="mt-2"
                    value={data.phone || ""}
                    onChange={(e) => update("phone", e.target.value)}
                />
            </div>
            <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    className="mt-2"
                    value={data.email || ""}
                    onChange={(e) => update("email", e.target.value)}
                />
            </div>
            <div>
                <Label htmlFor="relationship">Relationship to Proposer</Label>
                <Input
                    id="relationship"
                    placeholder="Cousin, friend, colleague..."
                    className="mt-2"
                    value={data.relationship || ""}
                    onChange={(e) => update("relationship", e.target.value)}
                />
            </div>
            <div>
                <Label htmlFor="why">Why should they join?</Label>
                <Textarea
                    id="why"
                    placeholder="Explain why this person would be a good fit..."
                    className="mt-2 min-h-[120px]"
                    value={data.reason || ""}
                    onChange={(e) => update("reason", e.target.value)}
                />
            </div>
        </div>
    )
}

function RemoveMemberForm({ data, update }: any) {
    return (
        <div className="space-y-4">
            <div>
                <Label htmlFor="member">Member to Remove</Label>
                <Input
                    id="member"
                    placeholder="Select member..."
                    className="mt-2"
                    value={data.member || ""}
                    onChange={(e) => update("member", e.target.value)}
                />
            </div>
            <div>
                <Label htmlFor="reason">Reason for Removal</Label>
                <Textarea
                    id="reason"
                    placeholder="Explain the reason for removal..."
                    className="mt-2 min-h-[120px]"
                    value={data.reason || ""}
                    onChange={(e) => update("reason", e.target.value)}
                />
            </div>
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-semibold text-red-900 mb-2">⚠️ Important</p>
                <p className="text-sm text-red-700">
                    Removing a member is a serious action. Ensure all outstanding contributions and loans are settled.
                </p>
            </div>
        </div>
    )
}

function EmergencyPayoutForm({ data, update }: any) {
    return (
        <div className="space-y-4">
            <div>
                <Label htmlFor="recipient">Recipient</Label>
                <Input
                    id="recipient"
                    placeholder="Member name..."
                    className="mt-2"
                    value={data.recipient || ""}
                    onChange={(e) => update("recipient", e.target.value)}
                />
            </div>
            <div>
                <Label htmlFor="amount">Payout Amount</Label>
                <Input
                    id="amount"
                    placeholder="KES 500,000"
                    className="mt-2"
                    value={data.amount || ""}
                    onChange={(e) => update("amount", e.target.value)}
                />
            </div>
            <div>
                <Label htmlFor="emergency">Emergency Reason</Label>
                <Textarea
                    id="emergency"
                    placeholder="Describe the emergency situation..."
                    className="mt-2 min-h-[120px]"
                    value={data.reason || ""}
                    onChange={(e) => update("reason", e.target.value)}
                />
            </div>
            <div>
                <Label htmlFor="impact">Impact on Payout Cycle</Label>
                <Textarea
                    id="impact"
                    placeholder="How will this affect the normal payout rotation?"
                    className="mt-2 min-h-[80px]"
                    value={data.impact || ""}
                    onChange={(e) => update("impact", e.target.value)}
                />
            </div>
        </div>
    )
}

function ChangePayoutOrderForm({ data, update }: any) {
    return (
        <div className="space-y-4">
            <div>
                <Label>Current Payout Order</Label>
                <div className="mt-2 p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                        1. Mercy Achieng → 2. John Kamau → 3. Beatrice Wanjiku → ...
                    </p>
                </div>
            </div>
            <div>
                <Label htmlFor="changes">Proposed Changes</Label>
                <Textarea
                    id="changes"
                    placeholder="Describe the new payout order..."
                    className="mt-2 min-h-[120px]"
                    value={data.changes || ""}
                    onChange={(e) => update("changes", e.target.value)}
                />
            </div>
            <div>
                <Label htmlFor="reason">Reason for Change</Label>
                <Textarea
                    id="reason"
                    placeholder="Why is this change necessary?"
                    className="mt-2 min-h-[80px]"
                    value={data.reason || ""}
                    onChange={(e) => update("reason", e.target.value)}
                />
            </div>
        </div>
    )
}

function EditConstitutionForm({ data, update }: any) {
    return (
        <div className="space-y-4">
            <div>
                <Label htmlFor="section">Constitution Section</Label>
                <Input
                    id="section"
                    placeholder="e.g., Article 3: Voting Rules"
                    className="mt-2"
                    value={data.section || ""}
                    onChange={(e) => update("section", e.target.value)}
                />
            </div>
            <div>
                <Label htmlFor="current-text">Current Text</Label>
                <Textarea
                    id="current-text"
                    placeholder="Current constitution text..."
                    className="mt-2 min-h-[100px]"
                    value={data.currentText || ""}
                    onChange={(e) => update("currentText", e.target.value)}
                />
            </div>
            <div>
                <Label htmlFor="proposed-text">Proposed Text</Label>
                <Textarea
                    id="proposed-text"
                    placeholder="New constitution text..."
                    className="mt-2 min-h-[100px]"
                    value={data.proposedText || ""}
                    onChange={(e) => update("proposedText", e.target.value)}
                />
            </div>
            <div>
                <Label htmlFor="justification">Justification</Label>
                <Textarea
                    id="justification"
                    placeholder="Why is this change needed?"
                    className="mt-2 min-h-[80px]"
                    value={data.justification || ""}
                    onChange={(e) => update("justification", e.target.value)}
                />
            </div>
        </div>
    )
}

function ProposalPreview({ type, data }: { type: ProposalType, data: any }) {
    const typeConfig = PROPOSAL_TYPES.find(t => t.id === type)!

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <Badge variant="outline" className="mb-2">PREVIEW</Badge>
                        <CardTitle className="text-2xl">
                            {type === "loan-request" ? `Loan Request: ${data.amount || "..."}` : typeConfig.name}
                        </CardTitle>
                        <CardDescription className="mt-2">
                            Proposed by You • {new Date().toLocaleDateString()}
                        </CardDescription>
                    </div>
                    <Badge>{typeConfig.name}</Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p className="text-muted-foreground">
                        {data.reason || data.purpose || data.justification || "No description provided."}
                    </p>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                    <h3 className="font-semibold mb-3">Voting Period</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-muted-foreground">Starts</p>
                            <p className="font-semibold">{new Date().toLocaleDateString()}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Ends</p>
                            <p className="font-semibold">
                                {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="font-semibold mb-2">Required Approval</h3>
                    <p className="text-muted-foreground">60% of members (15 out of 24)</p>
                </div>
            </CardContent>
        </Card>
    )
}

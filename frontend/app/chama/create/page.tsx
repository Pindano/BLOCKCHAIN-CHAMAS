"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
    ArrowLeft,
    ArrowRight,
    Users,
    Settings,
    CheckCircle2,
    Coins,
    Loader2
} from "lucide-react"
import { decodeEventLog } from 'viem'
import { useChamaFactory } from "@/hooks/useChamaFactory"
import { useUser } from "@/lib/UserContext"
import { uploadProposalToIPFS } from "@/app/actions/ipfs"
import { supabase } from "@/lib/supabase"
import { CHAMA_FACTORY_ABI } from "@/lib/contract-abis"
import { PublishChamaButton } from "@/components/dashboard/chamas/PublishChamaButton"
import { InviteMembersStep } from "@/components/dashboard/chamas/InviteMembersStep"
import { toast } from "sonner"

export default function CreateChamaPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const chamaId = searchParams.get("chamaId") // Get draft chamaId from URL

    const [step, setStep] = useState(1)
    const [chamaData, setChamaData] = useState({
        chamaName: "",
        description: "",
        contributionAmount: "",
        meetingFrequency: "monthly",  // weekly, biweekly, monthly, quarterly
        meetingSchedule: "",  // Natural language: "Every last Monday of the month"
        fineForMissing: "",  // Fine for missing meeting/contribution
        currency: "KSh",  // Fixed to KSh only
        adminName: ""  // Already initialized
    })

    const { createChama, isPending, isConfirming, isSuccess, receipt } = useChamaFactory()
    const { address, user } = useUser()
    const [isUploading, setIsUploading] = useState(false)
    const [constitutionIpfsHash, setConstitutionIpfsHash] = useState<string | null>(null)
    const [createdChamaId, setCreatedChamaId] = useState<string | null>(null)

    // Load draft Chama if chamaId is provided
    useEffect(() => {
        if (!chamaId || !user) return

        const loadDraft = async () => {
            try {
                const { data, error } = await supabase
                    .from("chamas")
                    .select("*")
                    .eq("chama_id", chamaId)
                    .eq("creator_id", user.user_id)
                    .eq("status", "draft")
                    .single()

                if (error) throw error

                if (data) {
                    // Load existing data
                    const constitution = data.metadata?.constitution || {}
                    setChamaData({
                        chamaName: data.name || "",
                        description: data.description || "",
                        contributionAmount: constitution.contributionAmount || "",
                        meetingFrequency: constitution.meetingFrequency || "monthly",
                        meetingSchedule: constitution.meetingSchedule || "",
                        fineForMissing: constitution.fineForMissing || "",
                        currency: constitution.currency || "KSh",
                        adminName: constitution.adminName || ""
                    })
                    setConstitutionIpfsHash(data.constitution_ipfs_cid)
                    setCreatedChamaId(chamaId)

                    // Jump to Step 4 (Invite & Publish)
                    setStep(4)
                }
            } catch (error) {
                console.error("Error loading draft:", error)
                // toast.error("Failed to load draft Chama") // Assuming toast is available
                router.push("/chama/create") // Redirect to clean slate
            }
        }

        loadDraft()
    }, [chamaId, user])

    const updateField = (field: string, value: string) => {
        setChamaData({ ...chamaData, [field]: value })
    }

    const handleCreate = async () => {
        console.log(user);
        if (!user) return
        setIsUploading(true)

        try {
            // 1. Upload Constitution to IPFS
            const ipfsHash = await uploadProposalToIPFS(chamaData)
            setConstitutionIpfsHash(ipfsHash)

            // 2. Create chama as DRAFT in database
            const { data: newChama, error: chamaError } = await supabase
                .from('chamas')
                .insert({
                    name: chamaData.chamaName,
                    description: chamaData.description,
                    constitution_ipfs_cid: ipfsHash,
                    creator_id: user.user_id,
                    status: "draft",
                    metadata: { constitution: chamaData },
                })
                .select()
                .single()

            if (chamaError) throw chamaError

            // 3. Add creator as admin member
            const { error: memberError } = await supabase
                .from("chama_members")
                .insert({
                    chama_id: newChama.chama_id,
                    user_id: user.user_id,
                    role: "admin",
                    voting_power: 1,
                })

            if (memberError) throw memberError

            // Store chama ID for Step 4
            setCreatedChamaId(newChama.chama_id)
            setIsUploading(false)
            setStep(4) // Move to invite/publish step
        } catch (err) {
            console.error("Error creating chama:", err)
            setIsUploading(false)
        }
    }

    // Note: Blockchain deployment now happens in Step 4 via PublishChamaButton

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
                            <h1 className="text-2xl font-heading font-bold">Create New Chama</h1>
                            <p className="text-sm text-muted-foreground">Step {step} of 3</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8 max-w-3xl">
                {/* Progress Indicator */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                        {[1, 2, 3].map((s) => (
                            <div key={s} className="flex items-center flex-1">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${s <= step
                                    ? 'bg-[var(--kente-orange)] text-white'
                                    : 'bg-muted text-muted-foreground'
                                    }`}>
                                    {s < step ? <CheckCircle2 className="w-6 h-6" /> : s}
                                </div>
                                {s < 3 && (
                                    <div className={`flex-1 h-1 mx-2 rounded ${s < step ? 'bg-[var(--kente-orange)]' : 'bg-muted'
                                        }`} />
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground px-1">
                        <span>Basic Info</span>
                        <span>Rules & Settings</span>
                        <span>Review & Create</span>
                    </div>
                </div>

                {/* Step Content */}
                {step === 1 && (
                    <Step1
                        data={chamaData}
                        updateField={updateField}
                        onNext={() => setStep(2)}
                        onBack={() => router.push("/dashboard")}
                    />
                )}
                {step === 2 && (
                    <Step2
                        data={chamaData}
                        updateField={updateField}
                        onNext={() => setStep(3)}
                        onBack={() => setStep(1)}
                    />
                )}
                {step === 3 && (
                    <Step3
                        data={chamaData}
                        onBack={() => setStep(2)}
                        onCreate={handleCreate}
                        isLoading={isUploading}
                        status={isUploading ? "Creating draft chama..." : "Create Draft"}
                    />
                )}
                {step === 4 && createdChamaId && (
                    <Step4
                        chamaId={createdChamaId}
                        chamaName={chamaData.chamaName}
                        onBack={() => setStep(3)}
                        onPublished={() => router.push(`/dashboard/chama/${createdChamaId}`)}
                    />
                )}
            </div>
        </div>
    )
}

function Step1({ data, updateField, onNext, onBack }: any) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[var(--kente-orange)]/10 to-[var(--ankara-teal)]/10 flex items-center justify-center">
                        <Users className="w-6 h-6 text-[var(--kente-orange)]" />
                    </div>
                    <div>
                        <CardTitle>Basic Information</CardTitle>
                        <CardDescription>Tell us about your Chama</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="name">Chama Name *</Label>
                    <Input
                        id="name"
                        placeholder="e.g., Nairobi Women's Circle"
                        value={data.chamaName}
                        onChange={(e) => updateField("chamaName", e.target.value)}
                        className="text-base"
                    />
                    <p className="text-xs text-muted-foreground">
                        Choose a name that represents your group
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                        id="description"
                        placeholder="Describe the purpose and goals of your Chama..."
                        value={data.description}
                        onChange={(e) => updateField("description", e.target.value)}
                        className="min-h-[120px]"
                    />
                    <p className="text-xs text-muted-foreground">
                        This will be visible to potential members
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="contribution">Contribution Amount *</Label>
                        <Input
                            id="contribution"
                            type="number"
                            placeholder="1000"
                            value={data.contributionAmount}
                            onChange={(e) => updateField("contributionAmount", e.target.value)}
                            className="text-base"
                        />
                    </div>

                    {/* Currency is now fixed to KSh */}
                    <input type="hidden" name="currency" value="KSh" />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="day">Contribution Due Date</Label>
                    <Input
                        id="day"
                        type="number"
                        min="1"
                        max="28"
                        placeholder="5"
                        value={data.contributionDay}
                        onChange={(e) => updateField("contributionDay", e.target.value)}
                        className="text-base"
                    />
                    <p className="text-xs text-muted-foreground">
                        Day of the month when contributions are due (1-28)
                    </p>
                </div>

                <div className="flex gap-3 pt-4">
                    <Button variant="outline" onClick={onBack} className="flex-1">
                        Cancel
                    </Button>
                    <Button
                        onClick={onNext}
                        className="flex-1 gap-2"
                        disabled={!data.chamaName || !data.description || !data.contributionAmount}
                    >
                        Next: Rules & Settings
                        <ArrowRight className="w-4 h-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

function Step2({ data, updateField, onNext, onBack }: any) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[var(--ankara-teal)]/10 to-[var(--adinkra-gold)]/10 flex items-center justify-center">
                        <Settings className="w-6 h-6 text-[var(--ankara-teal)]" />
                    </div>
                    <div>
                        <CardTitle>Rules & Settings</CardTitle>
                        <CardDescription>Set contribution rules and fines</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="meetingFrequency">Meeting Frequency *</Label>
                    <select
                        id="meetingFrequency"
                        value={data.meetingFrequency}
                        onChange={(e) => updateField("meetingFrequency", e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                        <option value="weekly">Weekly</option>
                        <option value="biweekly">Bi-weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                    </select>
                    <p className="text-xs text-muted-foreground">
                        How often your chama meets
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="meetingSchedule">Meeting Schedule</Label>
                    <Input
                        id="meetingSchedule"
                        type="text"
                        placeholder="e.g., Every last Monday of the month"
                        value={data.meetingSchedule}
                        onChange={(e) => updateField("meetingSchedule", e.target.value)}
                        className="text-base"
                    />
                    <p className="text-xs text-muted-foreground">
                        Describe when your chama meets in natural language
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="fineForMissing">Fine for Missing Meeting/Contribution</Label>
                    <Input
                        id="fineForMissing"
                        type="number"
                        min="0"
                        placeholder="50"
                        value={data.fineForMissing}
                        onChange={(e) => updateField("fineForMissing", e.target.value)}
                        className="text-base"
                    />
                    <p className="text-xs text-muted-foreground">
                        Amount to fine members who miss meetings or contributions ({data.currency})
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="adminName">Admin Name *</Label>
                    <Input
                        id="adminName"
                        type="text"
                        placeholder="Your name"
                        value={data.adminName}
                        onChange={(e) => updateField("adminName", e.target.value)}
                        className="text-base"
                    />
                    <p className="text-xs text-muted-foreground">
                        The name of the person administering this chama
                    </p>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                    <h4 className="font-semibold text-sm">Summary</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Contribution: {data.contributionAmount || "0"} {data.currency} {data.meetingFrequency}</li>
                        <li>• Meetings: {data.meetingSchedule || "Not specified"}</li>
                        <li>• Fine: {data.fineForMissing || "0"} {data.currency}</li>
                    </ul>
                </div>

                <div className="flex gap-3 pt-4">
                    <Button variant="outline" onClick={onBack} className="flex-1">
                        Back
                    </Button>
                    <Button onClick={onNext} className="flex-1 gap-2">
                        Next: Review
                        <ArrowRight className="w-4 h-4" />
                    </Button>
                </div>
            </CardContent >
        </Card >
    )
}

function Step3({ data, onBack, onCreate, isLoading, status }: any) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10 flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                        <CardTitle>Review & Create</CardTitle>
                        <CardDescription>Confirm your Chama details</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Basic Info */}
                <div className="space-y-3">
                    <h3 className="font-semibold flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Basic Information
                    </h3>
                    <div className="p-4 bg-muted/30 rounded-lg space-y-2">
                        <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Name:</span>
                            <span className="font-semibold">{data.name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Description:</span>
                            <span className="font-semibold text-right max-w-xs">{data.description}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Monthly Contribution:</span>
                            <span className="font-semibold text-[var(--kente-orange)]">
                                KES {parseInt(data.contributionAmount).toLocaleString()}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Due Date:</span>
                            <span className="font-semibold">{data.contributionDay}th of each month</span>
                        </div>
                    </div>
                </div>



                {/* Next Steps */}
                <div className="p-4 bg-[var(--kente-orange)]/10 border border-[var(--kente-orange)]/20 rounded-lg">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Coins className="w-4 h-4 text-[var(--kente-orange)]" />
                        What happens next?
                    </h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                        <li>1. Your Chama will be created</li>
                        <li>2. You'll be set as the admin</li>
                        <li>3. You can invite members via WhatsApp or email</li>
                        <li>4. Members can start contributing once they join</li>
                    </ul>
                </div>

                <div className="flex gap-3 pt-4">
                    <Button variant="outline" onClick={onBack} className="flex-1" disabled={isLoading}>
                        Back
                    </Button>
                    <Button onClick={onCreate} className="flex-1 gap-2" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                {status}
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="w-4 h-4" />
                                Create Chama
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

function Step4({ chamaId, chamaName, onBack, onPublished }: {
    chamaId: string;
    chamaName: string;
    onBack: () => void;
    onPublished: () => void
}) {
    const { user } = useUser()
    const [showPublish, setShowPublish] = useState(false)

    if (!user) return null

    if (showPublish) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Publish Chama</CardTitle>
                    <CardDescription>
                        Ready to deploy your Chama to the blockchain
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Publishing will create the Chama smart contracts on-chain with all accepted members as founders.
                        </p>

                        <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg">
                            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                                ⚠️ Important
                            </p>
                            <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                                All members who have accepted invitations and logged in will become founders. Wallets are automatically created when members log in.
                            </p>
                        </div>

                        <PublishChamaButton
                            chamaId={chamaId}
                            chamaName={chamaName}
                            onPublished={onPublished}
                        />

                        <Button
                            variant="outline"
                            onClick={() => setShowPublish(false)}
                            className="w-full"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Invitations
                        </Button>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <InviteMembersStep
            chamaId={chamaId}
            chamaName={chamaName}
            userId={user.user_id}
            onContinue={() => setShowPublish(true)}
        />
    )
}


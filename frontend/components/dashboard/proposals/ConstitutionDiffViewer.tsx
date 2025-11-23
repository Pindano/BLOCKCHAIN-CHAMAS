// components/dashboard/proposals/ConstitutionDiffViewer.tsx
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, ExternalLink } from "lucide-react"
import { toast } from "sonner"

interface DiffViewerProps {
    oldIpfsHash: string
    newIpfsHash: string
}

export function ConstitutionDiffViewer({ oldIpfsHash, newIpfsHash }: DiffViewerProps) {
    const [oldContent, setOldContent] = useState<string>("")
    const [newContent, setNewContent] = useState<string>("")
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchConstitutions()
    }, [oldIpfsHash, newIpfsHash])

    const fetchConstitutions = async () => {
        setLoading(true)
        try {
            const [oldRes, newRes] = await Promise.all([
                fetch(`https://gateway.pinata.cloud/ipfs/${oldIpfsHash}`),
                fetch(`https://gateway.pinata.cloud/ipfs/${newIpfsHash}`)
            ])

            const oldText = await oldRes.text()
            const newText = await newRes.text()

            setOldContent(oldText)
            setNewContent(newText)
        } catch (error) {
            console.error("Error fetching constitutions:", error)
            toast.error("Failed to load constitution versions")
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Constitution Changes</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">Loading diff...</div>
                </CardContent>
            </Card>
        )
    }

    const oldLines = oldContent.split('\n')
    const newLines = newContent.split('\n')
    const maxLines = Math.max(oldLines.length, newLines.length)

    return (
        <Card>
            <CardHeader>
                <CardTitle>Constitution Changes</CardTitle>
                <CardDescription>Side-by-side comparison of proposed changes</CardDescription>
                <div className="flex gap-2 mt-2">
                    <Button variant="outline" size="sm" asChild>
                        <a href={`https://gateway.pinata.cloud/ipfs/${oldIpfsHash}`} target="_blank" rel="noopener noreferrer" className="gap-2">
                            <ExternalLink className="w-3 h-3" />
                            View Old
                        </a>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                        <a href={`https://gateway.pinata.cloud/ipfs/${newIpfsHash}`} target="_blank" rel="noopener noreferrer" className="gap-2">
                            <ExternalLink className="w-3 h-3" />
                            View New
                        </a>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => {
                        const diff = generateDiffText(oldLines, newLines)
                        const blob = new Blob([diff], { type: 'text/plain' })
                        const url = URL.createObjectURL(blob)
                        const link = document.createElement('a')
                        link.href = url
                        link.download = 'constitution-diff.txt'
                        link.click()
                    }} className="gap-2">
                        <Download className="w-3 h-3" />
                        Download Diff
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                    {/* Old Version */}
                    <div className="border rounded-lg">
                        <div className="bg-red-50 dark:bg-red-950/20 px-4 py-2 border-b">
                            <p className="text-sm font-medium text-red-700 dark:text-red-400">Previous Constitution</p>
                        </div>
                        <div className="p-4 max-h-[600px] overflow-y-auto">
                            <pre className="text-xs font-mono whitespace-pre-wrap">
                                {oldLines.map((line, i) => {
                                    const isRemoved = !newLines.includes(line) && line.trim() !== ''
                                    return (
                                        <div key={i} className={isRemoved ? "bg-red-100 dark:bg-red-900/20 -mx-4 px-4" : ""}>
                                            <span className="text-muted-foreground mr-4">{i + 1}</span>
                                            {isRemoved && <span className="text-red-600 mr-2">-</span>}
                                            {line}
                                        </div>
                                    )
                                })}
                            </pre>
                        </div>
                    </div>

                    {/* New Version */}
                    <div className="border rounded-lg">
                        <div className="bg-green-50 dark:bg-green-950/20 px-4 py-2 border-b">
                            <p className="text-sm font-medium text-green-700 dark:text-green-400">Proposed Constitution</p>
                        </div>
                        <div className="p-4 max-h-[600px] overflow-y-auto">
                            <pre className="text-xs font-mono whitespace-pre-wrap">
                                {newLines.map((line, i) => {
                                    const isAdded = !oldLines.includes(line) && line.trim() !== ''
                                    return (
                                        <div key={i} className={isAdded ? "bg-green-100 dark:bg-green-900/20 -mx-4 px-4" : ""}>
                                            <span className="text-muted-foreground mr-4">{i + 1}</span>
                                            {isAdded && <span className="text-green-600 mr-2">+</span>}
                                            {line}
                                        </div>
                                    )
                                })}
                            </pre>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

function generateDiffText(oldLines: string[], newLines: string[]): string {
    let diff = "=== Constitution Diff ===\n\n"

    diff += "--- Previous Version ---\n"
    oldLines.forEach((line, i) => {
        if (!newLines.includes(line) && line.trim() !== '') {
            diff += `- ${line}\n`
        }
    })

    diff += "\n+++ Proposed Version +++\n"
    newLines.forEach((line, i) => {
        if (!oldLines.includes(line) && line.trim() !== '') {
            diff += `+ ${line}\n`
        }
    })

    return diff
}

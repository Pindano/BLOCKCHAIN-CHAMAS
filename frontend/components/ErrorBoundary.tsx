// components/ErrorBoundary.tsx
"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"

interface ErrorBoundaryProps {
    children: React.ReactNode
    fallback?: React.ReactNode
}

interface ErrorBoundaryState {
    hasError: boolean
    error?: Error
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props)
        this.state = { hasError: false }
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo)
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback
            }

            return (
                <div className="flex items-center justify-center min-h-[400px] p-4">
                    <Card className="max-w-md w-full">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-destructive" />
                                <CardTitle>Something went wrong</CardTitle>
                            </div>
                            <CardDescription>
                                An unexpected error occurred. Please try again.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {this.state.error && (
                                <div className="p-3 rounded-lg bg-muted text-sm">
                                    <p className="font-mono text-xs text-muted-foreground">
                                        {this.state.error.message}
                                    </p>
                                </div>
                            )}
                            <div className="flex gap-2">
                                <Button
                                    onClick={() => this.setState({ hasError: false, error: undefined })}
                                    variant="outline"
                                >
                                    Try Again
                                </Button>
                                <Button onClick={() => window.location.reload()}>
                                    Reload Page
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )
        }

        return this.props.children
    }
}

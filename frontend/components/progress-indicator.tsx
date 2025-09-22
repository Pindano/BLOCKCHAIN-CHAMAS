import { CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface Step {
  id: number
  title: string
  description: string
}

interface ProgressIndicatorProps {
  steps: Step[]
  currentStep: number
}

export function ProgressIndicator({ steps, currentStep }: ProgressIndicatorProps) {
  return (
    <div className="w-full max-w-3xl mx-auto mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const stepNumber = index + 1
          const isCompleted = stepNumber < currentStep
          const isCurrent = stepNumber === currentStep
          const isUpcoming = stepNumber > currentStep

          return (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn("flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors", {
                    "bg-primary border-primary text-primary-foreground": isCompleted,
                    "bg-primary/10 border-primary text-primary": isCurrent,
                    "bg-muted border-border text-muted-foreground": isUpcoming,
                  })}
                >
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-medium">{stepNumber}</span>
                  )}
                </div>
                <div className="mt-2 text-center">
                  <p
                    className={cn("text-sm font-medium", {
                      "text-primary": isCompleted || isCurrent,
                      "text-muted-foreground": isUpcoming,
                    })}
                  >
                    {step.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-24">{step.description}</p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn("flex-1 h-0.5 mx-4 transition-colors", {
                    "bg-primary": stepNumber < currentStep,
                    "bg-border": stepNumber >= currentStep,
                  })}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

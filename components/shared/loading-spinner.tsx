import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  className?: string
  size?: number
}

export const LoadingSpinner = ({ className, size = 24 }: LoadingSpinnerProps) => {
  return <Loader2 className={cn("animate-spin", className)} size={size} />
}

interface FullPageLoadingProps {
  message?: string
}

export const FullPageLoading = ({ message = "Loading..." }: FullPageLoadingProps) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh]">
      <LoadingSpinner size={32} className="text-primary mb-4" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  )
}

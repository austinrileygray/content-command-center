"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-6">
      <Card className="p-8 bg-card border-border max-w-md w-full">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="p-3 rounded-full bg-red-500/10 text-red-400">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Something went wrong!</h2>
            <p className="text-sm text-muted-foreground">
              {error.message || "An unexpected error occurred"}
            </p>
          </div>
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => window.location.href = "/"}>
              Go Home
            </Button>
            <Button onClick={reset} className="bg-brand hover:bg-brand/90">
              Try Again
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}



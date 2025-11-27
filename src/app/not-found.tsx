import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <h1 className="text-4xl font-bold text-foreground mb-4">404</h1>
      <p className="text-muted-foreground mb-8">Page not found</p>
      <Link href="/">
        <Button className="bg-brand hover:bg-brand/90">Go Home</Button>
      </Link>
    </div>
  )
}

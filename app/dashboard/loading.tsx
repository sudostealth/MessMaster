import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background/50 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
          <Loader2 className="h-12 w-12 animate-spin text-primary relative z-10" />
        </div>
        <p className="text-muted-foreground font-medium animate-pulse">Loading...</p>
      </div>
    </div>
  )
}

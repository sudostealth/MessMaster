"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Lock, ArrowRight, Loader2, CheckCircle } from "lucide-react"
import { motion } from "framer-motion"
import { toast } from "sonner"

export default function UpdatePasswordPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  // Ensure user is authenticated (which happens when they click the magic link)
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        // If no session, they might have landed here incorrectly or the link expired
        setError("Invalid or expired reset link. Please try again.")
      }
    }
    checkSession()
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const password = formData.get("password") as string
    const confirmPassword = formData.get("confirmPassword") as string

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) throw error

      toast.success("Password updated successfully")

      // Redirect to dashboard
      setTimeout(() => {
        router.push("/dashboard")
      }, 1000)

    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
      {/* Background Decor */}
      <div className="absolute inset-0 z-0 pointer-events-none">
         <div className="absolute -bottom-[20%] -left-[10%] h-[70vh] w-[70vh] rounded-full bg-primary/5 blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="z-10 w-full max-w-md"
      >
        <div className="glass-card overflow-hidden rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Update Password</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Enter your new password below
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground/80">New Password</Label>
              <div className="relative group">
                <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="New password"
                  required
                  className="!pl-12 h-11 bg-background/50 border-input/50 focus:bg-background focus:ring-1 focus:ring-primary/20 transition-all duration-300"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-foreground/80">Confirm New Password</Label>
              <div className="relative group">
                <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  required
                  className="!pl-12 h-11 bg-background/50 border-input/50 focus:bg-background focus:ring-1 focus:ring-primary/20 transition-all duration-300"
                />
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="rounded-lg bg-destructive/10 p-3 text-center text-sm font-medium text-destructive"
              >
                {error}
              </motion.div>
            )}

            <Button
              type="submit"
              className="w-full h-11 text-base font-medium shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-300"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  Update Password <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}

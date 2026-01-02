"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useLanguage } from "@/contexts/language-context"
import { Mail, Lock, ArrowRight, Loader2, Check } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()
  const { t } = useLanguage()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) throw signInError

      setSuccess(true)
      // Delay redirect to show animation
      setTimeout(() => {
        router.push("/dashboard")
        router.refresh()
      }, 1500)

    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
      {/* Background Decor */}
      <div className="absolute inset-0 z-0 pointer-events-none">
         <div className="absolute -top-[20%] -left-[10%] h-[70vh] w-[70vh] rounded-full bg-primary/10 blur-[120px]" />
         <div className="absolute top-[40%] -right-[10%] h-[60vh] w-[60vh] rounded-full bg-purple-500/10 blur-[100px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="z-10 w-full max-w-md"
      >
        <div className="glass-card overflow-hidden rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{t("welcome")}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("login_to_account")}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground/80">{t("email")}</Label>
              <div className="relative group">
                <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  required
                  className="!pl-12 h-11 bg-background/50 border-input/50 focus:bg-background focus:ring-1 focus:ring-primary/20 transition-all duration-300"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-foreground/80">{t("password")}</Label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-primary hover:text-primary/80 hover:underline"
                >
                  {t("forgot_password")}
                </Link>
              </div>
              <div className="relative group">
                <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
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
              disabled={loading || success}
            >
              {loading && !success ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                <>
                  {t("login")} <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            {t("dont_have_account")}{" "}
            <Link href="/signup" className="font-medium text-primary hover:text-primary/80 hover:underline transition-colors">
              {t("create_account")}
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Success Overlay */}
      <AnimatePresence>
        {success && (
          <motion.div
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md"
          >
             <div className="flex flex-col items-center">
                <div className="relative">
                   <motion.div
                     initial={{ scale: 0, opacity: 0 }}
                     animate={{ scale: 1, opacity: 1 }}
                     transition={{ duration: 0.5, type: "spring" }}
                     className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/30"
                   >
                      <Check className="w-12 h-12 text-white" strokeWidth={3} />
                   </motion.div>

                   {/* Ripple effect */}
                   <motion.div
                      initial={{ scale: 1, opacity: 0.5 }}
                      animate={{ scale: 1.5, opacity: 0 }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="absolute inset-0 rounded-full bg-green-500"
                   />
                </div>
                <motion.h2
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: 0.3 }}
                   className="mt-6 text-2xl font-bold text-foreground"
                >
                   Welcome Back!
                </motion.h2>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

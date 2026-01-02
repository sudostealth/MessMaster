"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useLanguage } from "@/contexts/language-context"
import { User, Mail, Lock, Phone, ArrowRight, Loader2, MailCheck } from "lucide-react"
import { motion } from "framer-motion"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

export default function SignupPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showVerifyModal, setShowVerifyModal] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { t } = useLanguage()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const phone = formData.get("phone") as string
    const password = formData.get("password") as string
    const confirmPassword = formData.get("confirmPassword") as string

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            phone,
          },
        },
      })

      if (signUpError) throw signUpError

      if (data.session) {
        // Auto sign-in scenario (if enabled)
        router.push("/dashboard")
      } else {
        // Email confirmation required scenario
        setShowVerifyModal(true)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
      {/* Background Decor */}
      <div className="absolute inset-0 z-0 pointer-events-none">
         <div className="absolute -bottom-[20%] -right-[10%] h-[80vh] w-[80vh] rounded-full bg-primary/10 blur-[130px]" />
         <div className="absolute top-[20%] -left-[10%] h-[50vh] w-[50vh] rounded-full bg-blue-500/10 blur-[100px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="z-10 w-full max-w-md"
      >
        <div className="glass-card overflow-hidden rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{t("create_account")}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("welcome")}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-foreground/80">{t("full_name")}</Label>
                  <div className="relative group">
                    <User className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
                    <Input
                      id="name"
                      name="name"
                      placeholder="John Doe"
                      required
                      className="!pl-12 h-11 bg-background/50 border-input/50 focus:bg-background focus:ring-1 focus:ring-primary/20 transition-all duration-300"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-foreground/80">{t("phone")}</Label>
                  <div className="relative group">
                    <Phone className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
                    <Input
                      id="phone"
                      name="phone"
                      placeholder="+8801..."
                      required
                      className="!pl-12 h-11 bg-background/50 border-input/50 focus:bg-background focus:ring-1 focus:ring-primary/20 transition-all duration-300"
                    />
                  </div>
                </div>
            </div>

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
              <Label htmlFor="password" className="text-foreground/80">{t("password")}</Label>
              <div className="relative group">
                <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Create a password"
                  required
                  className="!pl-12 h-11 bg-background/50 border-input/50 focus:bg-background focus:ring-1 focus:ring-primary/20 transition-all duration-300"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-foreground/80">{t("confirm")} {t("password")}</Label>
              <div className="relative group">
                <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Repeat password"
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
              className="w-full h-11 text-base font-medium shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-300 mt-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  {t("signup")} <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            {t("already_have_account")}{" "}
            <Link href="/login" className="font-medium text-primary hover:text-primary/80 hover:underline transition-colors">
              {t("login")}
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Email Verification Modal */}
      <Dialog open={showVerifyModal} onOpenChange={setShowVerifyModal}>
         <DialogContent className="glass-card sm:max-w-md border-0 ring-0 outline-none p-0 overflow-hidden">
            <div className="p-8 flex flex-col items-center justify-center text-center space-y-6 bg-gradient-to-b from-primary/5 to-transparent">
               <motion.div
                 initial={{ scale: 0, rotate: -20 }}
                 animate={{ scale: 1, rotate: 0 }}
                 transition={{ type: "spring", stiffness: 200, damping: 15 }}
                 className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary"
               >
                  <MailCheck className="w-10 h-10" />
               </motion.div>

               <div className="space-y-2">
                 <DialogTitle className="text-2xl font-bold">Check your email</DialogTitle>
                 <DialogDescription className="text-base text-muted-foreground max-w-xs mx-auto">
                    We've sent a confirmation link to your email address. Please verify to continue.
                 </DialogDescription>
               </div>

               <Button
                 className="w-full max-w-[200px]"
                 variant="outline"
                 onClick={() => router.push("/login")}
               >
                 Go to Login
               </Button>
            </div>
         </DialogContent>
      </Dialog>
    </div>
  )
}

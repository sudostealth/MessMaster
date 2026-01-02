"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import styles from "./page.module.css"
import { createClient } from "@/lib/supabase/client"
import { useLanguage } from "@/contexts/language-context"
import { motion } from "framer-motion"
import { ArrowRight, LayoutDashboard, Utensils, Wallet } from "lucide-react"

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()
  const { t } = useLanguage()

  useEffect(() => {
    const getUser = async () => {
       const { data: { user } } = await supabase.auth.getUser()
       setUser(user)
    }
    getUser()
  }, [])

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden bg-background">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/20 rounded-full blur-[120px] opacity-30" />
          <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-purple-600/10 rounded-full blur-[120px] opacity-30" />
      </div>

      <main className="flex-1 container flex flex-col items-center justify-center py-20 z-10 text-center">
        <motion.div
           initial={{ opacity: 0, y: 30 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.8, ease: "easeOut" }}
           className="space-y-6 max-w-4xl mx-auto"
        >
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground">
            {t("app.name") || "MessMaster"} <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">
              Management Simplified.
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {t("welcome") || "Experience the premium way to manage your mess finance, meals, and members with effortless precision."}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
             {user ? (
                <Link href="/dashboard">
                  <Button size="lg" className="h-14 px-8 text-lg rounded-full shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all hover:-translate-y-1">
                     {t("dashboard")} <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
             ) : (
                <>
                  <Link href="/login">
                    <Button size="lg" className="h-14 px-8 text-lg rounded-full shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all hover:-translate-y-1">
                      {t("login")}
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button variant="outline" size="lg" className="h-14 px-8 text-lg rounded-full border-2 hover:bg-secondary/50 transition-all hover:-translate-y-1">
                      {t("signup")}
                    </Button>
                  </Link>
                </>
             )}
          </div>
        </motion.div>

        {/* Feature Highlights */}
        <motion.div
           initial={{ opacity: 0, y: 50 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.4, duration: 0.8 }}
           className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 w-full max-w-5xl"
        >
            <FeatureCard
               icon={<Utensils className="h-8 w-8 text-primary" />}
               title="Smart Meal Tracking"
               description="Effortlessly track daily meals for all members with our intuitive bulk entry system."
            />
            <FeatureCard
               icon={<Wallet className="h-8 w-8 text-purple-600" />}
               title="Transparent Finance"
               description="Keep track of every penny with detailed cost breakdown and deposit history."
            />
             <FeatureCard
               icon={<LayoutDashboard className="h-8 w-8 text-indigo-500" />}
               title="Real-time Insights"
               description="Get instant overview of meal rates, total costs and balance status."
            />
        </motion.div>
      </main>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: any, title: string, description: string }) {
   return (
      <div className="glass-card p-6 rounded-2xl text-left hover:scale-[1.02] transition-transform duration-300">
         <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            {icon}
         </div>
         <h3 className="text-xl font-bold mb-2">{title}</h3>
         <p className="text-muted-foreground">{description}</p>
      </div>
   )
}

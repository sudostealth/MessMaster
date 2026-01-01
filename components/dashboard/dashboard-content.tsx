"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CreateMessForm } from "@/components/onboarding/create-mess-form"
import { JoinMessForm } from "@/components/onboarding/join-mess-form"
import { DashboardStats } from "@/components/dashboard/dashboard-stats"
import { useLanguage } from "@/contexts/language-context"

interface DashboardContentProps {
    user: any;
    membership: any;
    stats: any;
    message: string;
}

export function DashboardContent({ user, membership, stats, message }: DashboardContentProps) {
    const { t } = useLanguage()

    if (membership) {
        if (membership.status === 'pending') {
             return (
                 <div className="container py-10">
                     <div className="text-center space-y-4">
                         <h1 className="text-2xl font-bold">{t("pending")}</h1>
                         <p className="text-muted-foreground">{t("request_sent_to")} <span className="font-semibold">{membership.messes?.name}</span>.</p>
                     </div>
                 </div>
             )
        }
        
        // Time-based greeting logic
        const currentHour = new Date().getHours()
        let greeting = "Good Evening"
        if (currentHour < 12) greeting = "Good Morning"
        else if (currentHour < 18) greeting = "Good Afternoon"
        // Note: Greetings are hard to translate dynamically without dictionary keys for them. 
        // For now I'll keep them English or add simple keys if I want.
        // Let's assume English for greeting logic or I can add keys.

        return (
          <div className="container py-8 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
               <div>
                  <p className="text-muted-foreground font-medium">{greeting},</p>
                  <h1 className="text-3xl font-bold tracking-tight text-gradient">{user.user_metadata?.name || "Member"}</h1>
               </div>
               
               <div className="glass px-4 py-2 rounded-full flex items-center gap-2 text-sm font-medium">
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  {membership.messes?.name}
               </div>
            </div>
               {/* Add Month Selector or Actions here later */}
    
            
            {stats ? (
                <DashboardStats data={stats} />
            ) : (
                <div className="p-8 border border-dashed rounded-lg text-center">
                    <h3 className="text-lg font-medium">{t("no_active_month")}</h3>
                    <p className="text-muted-foreground mb-4">{message || t("ask_manager_start_month")}</p>
                    {/* If manager, show button to start month */}
                    {membership.role === 'manager' && (
                        <Link href="/dashboard/start-month">
                          <Button>{t("start_month")}</Button>
                        </Link>
                    )}
                </div>
            )}
          </div>
        )
      }
    
      // User is NOT in a mess -> Show Onboarding
      return (
        <div className="container py-10">
          <div className="max-w-4xl mx-auto space-y-8 text-center mb-10">
            <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
              {t("welcome")}
            </h1>
            <p className="text-xl text-muted-foreground">
              {t("onboarding_subtitle")}
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
            <CreateMessForm />
            <div className="flex items-center justify-center text-muted-foreground font-medium">
                OR
            </div>
            <JoinMessForm />
          </div>
        </div>
      )
}

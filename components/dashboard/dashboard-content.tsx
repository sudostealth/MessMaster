"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CreateMessForm } from "@/components/onboarding/create-mess-form"
import { JoinMessForm } from "@/components/onboarding/join-mess-form"
import { DashboardStats } from "@/components/dashboard/dashboard-stats"
import { useLanguage } from "@/contexts/language-context"
import { Badge } from "@/components/ui/badge"
import { Download, Loader2 } from "lucide-react"
import { getDetailedMonthReport } from "@/app/actions/reports"
import { generateMonthReportPDF } from "@/lib/pdf-generator"
import { toast } from "sonner"
import { useState } from "react"

interface DashboardContentProps {
    user: any;
    membership: any;
    stats: any;
    message: string;
}

export function DashboardContent({ user, membership, stats, message }: DashboardContentProps) {
    const { t } = useLanguage()
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)

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

        const handleDownloadPDF = async () => {
             setIsGeneratingPdf(true)
             try {
                const res = await getDetailedMonthReport()
                if ('error' in res) {
                    toast.error(res.error)
                    return
                }

                // @ts-expect-error
                await generateMonthReportPDF(res)
                toast.success("Report generated successfully")
             } catch (error) {
                console.error(error)
                toast.error("Failed to generate report")
             } finally {
                setIsGeneratingPdf(false)
             }
        }

        const isManager = membership.role === 'manager' || membership.can_manage_finance

        return (
          <div className="container py-8 space-y-8">
            <div className="flex flex-col gap-2 mb-6">
                <div className="flex flex-wrap items-center gap-4">
                   <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600">
                      {membership.messes?.name}
                   </h1>
                   {stats?.monthName && (
                        <Badge className="text-lg px-3 py-1 bg-violet-100 text-violet-700 hover:bg-violet-100 border-violet-200">
                            {stats.monthName}
                        </Badge>
                   )}
                </div>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mt-2">
                    <p className="text-muted-foreground font-medium text-lg">
                        {greeting}, <span className="text-foreground font-semibold">{user.user_metadata?.name || "Member"}</span>
                    </p>

                    {stats && isManager && (
                        <Button
                          onClick={handleDownloadPDF}
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          disabled={isGeneratingPdf}
                        >
                           {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin"/> : <Download className="w-4 h-4"/>}
                           {isGeneratingPdf ? "Generating..." : "Download Report"}
                        </Button>
                    )}
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

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Archive, Plus, Trash2 } from "lucide-react"

// We will assume these actions exist or will create them
import { startNewMonth, endMonth, deleteMonth } from "@/app/actions/month"

interface MonthManagerProps {
  activeMonth: any
  pastMonths: any[]
  isManager: boolean
}

export function MonthManager({ activeMonth, pastMonths, isManager }: MonthManagerProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  if (!isManager) return null

  const handleEndMonth = async () => {
      if (confirm("Are you sure you want to END the current month? This will archive it.")) {
        setLoading(true)
        await endMonth(activeMonth.id)
        setLoading(false)
        router.refresh()
      }
  }

  const handleDeleteMonth = async (id: string) => {
      if (confirm("Are you sure you want to DELETE this month? All data will be lost!")) {
         setLoading(true)
         const res = await deleteMonth(id)
         setLoading(false)
         if (res?.error) {
             alert(res.error)
         } else {
             router.refresh()
         }
      }
  }

  return (
    <Card className="glass-card">
       <CardHeader>
         <CardTitle className="flex items-center justify-between">
            Month Management
            <Button size="sm" variant="outline" onClick={() => router.push('/dashboard/start-month')}>
               <Plus className="mr-2 h-4 w-4" /> Start New
            </Button>
         </CardTitle>
         <CardDescription>Manage your mess accounting periods.</CardDescription>
       </CardHeader>
       <CardContent className="space-y-4">
          {activeMonth ? (
              <div className="flex items-center justify-between p-4 border rounded-lg bg-green-500/10 border-green-500/20">
                 <div>
                    <h4 className="font-bold text-green-600">{activeMonth.name} (Active)</h4>
                    <p className="text-xs text-muted-foreground">Started: {new Date(activeMonth.start_date).toLocaleDateString()}</p>
                 </div>
                 <Button variant="default" size="sm" onClick={handleEndMonth} disabled={loading} className="bg-red-500 hover:bg-red-600 text-white">
                    <Archive className="mr-2 h-4 w-4" /> End Month
                 </Button>
              </div>
          ) : (
              <div className="text-center p-4 border border-dashed rounded-lg text-muted-foreground">
                  No active month. Start one to begin tracking.
              </div>
          )}

          {pastMonths.length > 0 && (
             <div className="space-y-2 mt-4">
                <h4 className="text-sm font-semibold text-muted-foreground">History</h4>
                {pastMonths.map((m: any) => (
                    <div key={m.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                        <span className="text-sm font-medium">{m.name}</span>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteMonth(m.id)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
             </div>
          )}
       </CardContent>
    </Card>
  )
}

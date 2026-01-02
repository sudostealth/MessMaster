"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { deleteMeal } from "@/app/actions/meal"
import { useLanguage } from "@/contexts/language-context"
import { Trash2 } from "lucide-react"

export function MealManager({ members, meals, month, currentUserId, isManager }: { members: any[], meals: any[], month: any, currentUserId: string, isManager: boolean }) {
  const { t } = useLanguage()
  const [loading, setLoading] = useState(false)

  // ... (date logic)
  const today = new Date().toISOString().split('T')[0]

  const handleDelete = async (mealId: string) => {
      if(!confirm("Delete this meal entry?")) return
      setLoading(true)
      await deleteMeal(mealId)
      setLoading(false)
  }

  return (
    <div className="space-y-6">
       <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
              <h2 className="text-3xl font-bold tracking-tight text-gradient">{t("meals")}</h2>
              <p className="text-muted-foreground">{t("tracking_for")} {month.name}</p>
          </div>
          {/* Add Meal button removed. Accessed via Sidebar now. */}
       </div>

       <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
           {members.map(member => {
               const memberMeals = meals.filter(m => m.user_id === member.user_id)
               const total = memberMeals.reduce((acc, curr) => acc + (Number(curr.breakfast) + Number(curr.lunch) + Number(curr.dinner)), 0)

               return (
                   <Card key={member.user_id} className="glass-card overflow-hidden">
                       <CardHeader className="flex flex-row items-center gap-4 pb-2">
                           <Avatar>
                               <AvatarImage src={member.profiles.avatar_url} />
                               <AvatarFallback>{member.profiles.name[0]}</AvatarFallback>
                           </Avatar>
                           <div>
                               <CardTitle className="text-base">{member.profiles.name}</CardTitle>
                               <CardDescription className="text-xs">Total: {total}</CardDescription>
                           </div>
                       </CardHeader>
                       <CardContent className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar space-y-2">
                           {memberMeals.length === 0 ? (
                               <p className="text-xs text-muted-foreground text-center py-4">{t("no_meals_logged")}</p>
                           ) : (
                               memberMeals.map((meal: any) => (
                                   <div key={meal.id} className="flex items-center justify-between text-sm p-2 rounded-lg bg-muted/50 border hover:border-primary/50 transition-colors">
                                       <div className="font-medium text-xs text-muted-foreground w-20">
                                           {format(new Date(meal.date), "MMM d")}
                                       </div>
                                       <div className="flex gap-2 text-xs font-mono">
                                           <span title="Breakfast" className={meal.breakfast > 0 ? "text-orange-500 font-bold" : "text-muted/50"}>B:{meal.breakfast}</span>
                                           <span title="Lunch" className={meal.lunch > 0 ? "text-yellow-600 font-bold" : "text-muted/50"}>L:{meal.lunch}</span>
                                           <span title="Dinner" className={meal.dinner > 0 ? "text-blue-500 font-bold" : "text-muted/50"}>D:{meal.dinner}</span>
                                       </div>
                                       {isManager && (
                                           <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:bg-red-500/10" onClick={() => handleDelete(meal.id)} disabled={loading}>
                                               <Trash2 className="h-3 w-3" />
                                           </Button>
                                       )}
                                   </div>
                               ))
                           )}
                       </CardContent>
                   </Card>
               )
           })}
       </div>
    </div>
  )
}

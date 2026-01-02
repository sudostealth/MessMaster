"use client"

import { useMemo } from "react"
import { format, subDays, eachDayOfInterval, startOfMonth, endOfMonth, isSameMonth } from "date-fns"
import { useLanguage } from "@/contexts/language-context"
import { MealDayCard } from "./meal-day-card"
import { StatsCard } from "@/components/dashboard/stats-card"
import { Utensils, Calendar } from "lucide-react"

export function MealManager({ members, meals, month, currentUserId, isManager }: { members: any[], meals: any[], month: any, currentUserId: string, isManager: boolean }) {
  const { t } = useLanguage()

  // 1. Get all unique dates.
  // Strategy: We want to show dates that HAVE meals, OR if it's the current month, maybe show all days?
  // User req: "Group meals by date (most recent first)". Usually this implies dates with records.
  // However, for UX, showing "Today" even if empty is good.
  // Let's stick to: Unique dates from `meals` + Today (if in range)

  const groupedMeals = useMemo(() => {
      const groups: Record<string, any[]> = {}
      meals.forEach(meal => {
          if (!groups[meal.date]) groups[meal.date] = []
          groups[meal.date].push(meal)
      })
      return groups
  }, [meals])

  const sortedDates = useMemo(() => {
      const dates = Object.keys(groupedMeals).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      // Ensure "Today" is present if it's within the active month range
      // actually, let's just use the dates we have data for, plus maybe today if missing?
      // If we want "Add" functionality via this view, we need the date card to exist.
      // But we have "Add Meal" page for creating new dates. This is "View/Edit".
      // EXCEPT: "Clicking Edit on a meal card makes fields editable".
      // If a manager wants to edit a user's meal on a date where OTHER users have meals, the row needs to exist.
      // My `MealDayCard` handles showing all members for a date.
      // So as long as the DATE exists in `sortedDates`, all members get a row.

      return dates
  }, [groupedMeals])

  // Calculate Summary Stats
  const totalMeals = meals.reduce((acc, curr) => acc + (Number(curr.breakfast) + Number(curr.lunch) + Number(curr.dinner)), 0)

  const myMeals = meals.filter(m => m.user_id === currentUserId)
  const myTotal = myMeals.reduce((acc, curr) => acc + (Number(curr.breakfast) + Number(curr.lunch) + Number(curr.dinner)), 0)

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

       {/* Summary Section */}
       <div className="grid gap-4 md:grid-cols-3">
            <StatsCard
                title="Total Meals (Month)"
                value={totalMeals}
                icon={Utensils}
                subValue={month.name}
                className="bg-primary/5 border-primary/20"
            />
             <StatsCard
                title="My Meals"
                value={myTotal}
                icon={Utensils}
                subValue="Personal Consumption"
                className="bg-blue-500/5 border-blue-500/20"
            />
            <StatsCard
                title="Active Days"
                value={sortedDates.length}
                icon={Calendar}
                subValue="Days with records"
                className="bg-green-500/5 border-green-500/20"
            />
       </div>

       {/* Daily Lists */}
       <div className="space-y-6">
           {sortedDates.length === 0 ? (
               <div className="text-center py-12 border border-dashed rounded-xl bg-muted/30">
                   <p className="text-muted-foreground">No meal records found for this month.</p>
               </div>
           ) : (
               sortedDates.map(date => (
                   <MealDayCard
                        key={date}
                        date={date}
                        members={members}
                        meals={groupedMeals[date] || []}
                        isManager={isManager}
                        currentUserId={currentUserId}
                   />
               ))
           )}
       </div>
    </div>
  )
}

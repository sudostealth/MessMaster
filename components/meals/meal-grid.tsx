"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { format, eachDayOfInterval, startOfMonth, endOfMonth, parseISO } from "date-fns"

interface MealGridProps {
  members: any[]
  meals: any[]
  month: any
}

export function MealGrid({ members, meals, month }: MealGridProps) {
  // Generate days for the month
  // Assuming month.start_date and month.end_date are "YYYY-MM-DD"
  // If end_date is null (current month), use today or end of current month
  
  const startDate = parseISO(month.start_date)
  // For safety, defaulting end date to roughly 30 days out if missing, or end of month
  const endDate = month.end_date ? parseISO(month.end_date) : endOfMonth(startDate)

  const days = eachDayOfInterval({ start: startDate, end: endDate })

  // Transform meals data for quick lookup: [date][userId] -> {B, L, D}
  const mealMap: Record<string, Record<string, any>> = {}
  
  meals.forEach(meal => {
    if (!mealMap[meal.date]) mealMap[meal.date] = {}
    mealMap[meal.date][meal.user_id] = meal
  })

  // Calculate totals per member
  const memberTotals = members.map(m => {
      let total = 0
      meals.filter(meal => meal.user_id === m.user_id).forEach(meal => {
          total += (meal.breakfast || 0) + (meal.lunch || 0) + (meal.dinner || 0)
      })
      return { id: m.user_id, total }
  })


  return (
    <div className="relative w-full overflow-auto">
      <Table>
        <TableHeader className="bg-muted/50 sticky top-0 z-10 backdrop-blur-md">
          <TableRow>
            <TableHead className="w-[150px] sticky left-0 z-20 bg-background/95 backdrop-blur font-bold border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
              Date
            </TableHead>
            {members.map((member) => (
              <TableHead key={member.user_id} className="text-center min-w-[100px] border-l">
                <div>{member.profiles.name}</div>
                <div className="text-[10px] text-muted-foreground font-normal">
                   Total: {memberTotals.find((t: any) => t.id === member.user_id)?.total || 0}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {days.map((day) => {
             const dateStr = format(day, "yyyy-MM-dd")
             const isToday = dateStr === format(new Date(), "yyyy-MM-dd")
             
             return (
              <TableRow key={dateStr} className={cn("hover:bg-muted/30 transition-colors", isToday && "bg-primary/5")}>
                <TableCell className={cn(
                    "sticky left-0 z-10 font-medium border-r bg-background/95 backdrop-blur",
                    isToday && "text-primary border-primary/20"
                )}>
                  <div className="flex flex-col">
                    <span className="text-sm">{format(day, "dd MMM")}</span>
                    <span className="text-[10px] text-muted-foreground">{format(day, "EEE")}</span>
                  </div>
                </TableCell>
                {members.map((member) => {
                  const meal = mealMap[dateStr]?.[member.user_id]
                  const b = meal?.breakfast || 0
                  const l = meal?.lunch || 0
                  const d = meal?.dinner || 0
                  const total = b + l + d
                  
                  return (
                    <TableCell key={member.user_id} className="p-2 border-l text-center">
                      <div className="flex items-center justify-center gap-1">
                        {total === 0 ? (
                            <span className="text-muted-foreground/20">-</span>
                        ) : (
                            <>
                                {b > 0 && <span className="h-2 w-2 rounded-full bg-orange-400" title={`Breakfast: ${b}`} />}
                                {l > 0 && <span className="h-2 w-2 rounded-full bg-green-500" title={`Lunch: ${l}`} />}
                                {d > 0 && <span className="h-2 w-2 rounded-full bg-blue-500" title={`Dinner: ${d}`} />}
                                <span className="ml-1 text-xs font-semibold">{total}</span>
                            </>
                        )}
                      </div>
                    </TableCell>
                  )
                })}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

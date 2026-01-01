"use client"

import { MealMatrix } from "@/components/meals/meal-matrix"

interface MealManagerProps {
  members: any[]
  meals: any[]
  month: any
  currentUserId: string
  isManager: boolean
}

export function MealManager({ members, meals, month, currentUserId, isManager }: MealManagerProps) {
  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gradient">Meal Management</h1>
            <p className="text-muted-foreground">Daily meal records for {month.name}</p>
          </div>
       </div>

       <MealMatrix 
          members={members} 
          meals={meals} 
          month={month}
          currentUserId={currentUserId}
          isManager={isManager}
       />
    </div>
  )
}

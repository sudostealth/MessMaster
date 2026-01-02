"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { format, isToday } from "date-fns"
import { MealRow } from "./meal-row"
import { Badge } from "@/components/ui/badge"

interface MealDayCardProps {
    date: string
    members: any[]
    meals: any[] // All meals for this date
    isManager: boolean
    currentUserId: string
}

export function MealDayCard({ date, members, meals, isManager, currentUserId }: MealDayCardProps) {
    const dateObj = new Date(date)
    const isCurrentDay = isToday(dateObj)

    // Calculate daily total
    const dailyTotal = meals.reduce((acc, curr) => acc + (Number(curr.breakfast) + Number(curr.lunch) + Number(curr.dinner)), 0)

    // Filter members based on role
    // User Requirement: "Every member can see the meal deatils of every members in the mess in meals page as manger see the meals details"
    // So we show ALL members to everyone.
    // The `isManager` prop passed down controls whether the inputs are editable.
    const visibleMembers = members

    if (visibleMembers.length === 0) return null

    return (
        <Card className={`glass-card overflow-hidden border-none shadow-md ${isCurrentDay ? 'ring-2 ring-primary/20' : ''}`}>
            <CardHeader className="bg-muted/30 border-b border-border/50 py-3 px-4 flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                        <span className="text-lg font-bold text-foreground">
                            {format(dateObj, "EEEE, MMM do")}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            {format(dateObj, "yyyy")}
                        </span>
                    </div>
                    {isCurrentDay && <Badge variant="default" className="bg-primary/80 hover:bg-primary/90">Today</Badge>}
                </div>
                <div className="text-sm font-medium text-muted-foreground bg-background/50 px-3 py-1 rounded-full border border-border/50">
                    Daily Total: <span className="text-foreground font-bold">{dailyTotal}</span>
                </div>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-border/40">
                {/* Column Headers (Desktop) */}
                <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 bg-muted/20 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <div className="col-span-4">Member</div>
                    <div className="col-span-5 grid grid-cols-3 text-center">
                        <span>Breakfast</span>
                        <span>Lunch</span>
                        <span>Dinner</span>
                    </div>
                    <div className="col-span-3 text-right pr-12">Total & Actions</div>
                </div>

                {visibleMembers.map(member => {
                    const meal = meals.find(m => m.user_id === member.user_id)
                    return (
                        <MealRow
                            key={member.user_id}
                            member={member}
                            meal={meal}
                            date={date}
                            isManager={isManager}
                        />
                    )
                })}
            </CardContent>
        </Card>
    )
}

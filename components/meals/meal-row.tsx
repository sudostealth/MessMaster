"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Check, Edit2, Trash2, X } from "lucide-react"
import { addMeal, deleteMeal } from "@/app/actions/meal"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface MealRowProps {
    member: any
    meal: any
    date: string
    isManager: boolean
}

export function MealRow({ member, meal, date, isManager }: MealRowProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [loading, setLoading] = useState(false)

    // Initial values from meal or defaults
    const [values, setValues] = useState({
        breakfast: meal?.breakfast || 0,
        lunch: meal?.lunch || 0,
        dinner: meal?.dinner || 0
    })

    const total = Number(values.breakfast) + Number(values.lunch) + Number(values.dinner)
    const originalTotal = meal ? (Number(meal.breakfast) + Number(meal.lunch) + Number(meal.dinner)) : 0

    const handleSave = async () => {
        setLoading(true)
        const formData = new FormData()
        formData.append("date", date)
        formData.append("memberId", member.user_id)
        formData.append("breakfast", values.breakfast.toString())
        formData.append("lunch", values.lunch.toString())
        formData.append("dinner", values.dinner.toString())

        const res = await addMeal(formData)
        setLoading(false)

        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success("Meal updated")
            setIsEditing(false)
        }
    }

    const handleDelete = async () => {
        if (!meal?.id) return
        if (!confirm("Are you sure you want to delete this record?")) return

        setLoading(true)
        const res = await deleteMeal(meal.id)
        setLoading(false)

        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success("Meal deleted")
        }
    }

    const handleCancel = () => {
        setValues({
            breakfast: meal?.breakfast || 0,
            lunch: meal?.lunch || 0,
            dinner: meal?.dinner || 0
        })
        setIsEditing(false)
    }

    // If regular member and no meal, don't render (should be handled by parent, but safety check)
    // Actually parent handles visibility.

    return (
        <div className={cn(
            "grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-4 rounded-lg transition-colors",
            isEditing ? "bg-primary/5 border border-primary/20" : "hover:bg-muted/30 border border-transparent"
        )}>
            {/* Member Info */}
            <div className="md:col-span-4 flex items-center gap-3">
                <Avatar className="h-8 w-8 md:h-10 md:w-10 border border-border">
                    <AvatarImage src={member.profiles.avatar_url} />
                    <AvatarFallback>{member.profiles.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                    <div className="font-medium text-sm md:text-base truncate">
                        {member.profiles.name}
                    </div>
                    {meal?.added_by_profile && (
                        <div className="text-[10px] text-muted-foreground">
                            Added by {meal.added_by_profile.name}
                        </div>
                    )}
                </div>
            </div>

            {/* Meal Counts */}
            <div className="md:col-span-5 grid grid-cols-3 gap-2 md:gap-4">
                {isEditing ? (
                    <>
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] uppercase text-muted-foreground font-bold md:hidden">Breakfast</span>
                            <Input
                                type="number"
                                step="0.5"
                                min="0"
                                value={values.breakfast}
                                onChange={e => setValues({...values, breakfast: Number(e.target.value)})}
                                className="h-8 text-center"
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                             <span className="text-[10px] uppercase text-muted-foreground font-bold md:hidden">Lunch</span>
                            <Input
                                type="number"
                                step="0.5"
                                min="0"
                                value={values.lunch}
                                onChange={e => setValues({...values, lunch: Number(e.target.value)})}
                                className="h-8 text-center"
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                             <span className="text-[10px] uppercase text-muted-foreground font-bold md:hidden">Dinner</span>
                            <Input
                                type="number"
                                step="0.5"
                                min="0"
                                value={values.dinner}
                                onChange={e => setValues({...values, dinner: Number(e.target.value)})}
                                className="h-8 text-center"
                            />
                        </div>
                    </>
                ) : (
                    <>
                         <div className="flex flex-col items-center justify-center p-1 rounded bg-orange-500/10 text-orange-600 font-mono text-sm md:text-base font-semibold">
                            <span className="text-[8px] uppercase text-muted-foreground md:hidden mb-0.5">B</span>
                            {meal?.breakfast || 0}
                         </div>
                         <div className="flex flex-col items-center justify-center p-1 rounded bg-yellow-500/10 text-yellow-600 font-mono text-sm md:text-base font-semibold">
                            <span className="text-[8px] uppercase text-muted-foreground md:hidden mb-0.5">L</span>
                            {meal?.lunch || 0}
                         </div>
                         <div className="flex flex-col items-center justify-center p-1 rounded bg-blue-500/10 text-blue-600 font-mono text-sm md:text-base font-semibold">
                            <span className="text-[8px] uppercase text-muted-foreground md:hidden mb-0.5">D</span>
                            {meal?.dinner || 0}
                         </div>
                    </>
                )}
            </div>

            {/* Total & Actions */}
            <div className="md:col-span-3 flex items-center justify-between md:justify-end gap-4 mt-2 md:mt-0 pt-2 md:pt-0 border-t md:border-t-0 border-dashed border-border/50">
                <div className="flex flex-col md:flex-row items-baseline gap-1 md:gap-2">
                    <span className="text-xs text-muted-foreground md:hidden">Total:</span>
                    <span className="font-bold text-foreground font-mono text-lg">{isEditing ? total : originalTotal}</span>
                </div>

                {isManager && (
                    <div className="flex items-center gap-1">
                        {isEditing ? (
                            <>
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600 hover:bg-green-100 hover:text-green-700" onClick={handleSave} disabled={loading}>
                                    <Check className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:bg-muted" onClick={handleCancel} disabled={loading}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-primary hover:bg-primary/10" onClick={() => setIsEditing(true)}>
                                    <Edit2 className="h-4 w-4" />
                                </Button>
                                {meal && (
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={handleDelete}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

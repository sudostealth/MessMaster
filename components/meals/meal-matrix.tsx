"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Calendar, Edit2, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { addMeal, deleteMeal } from "@/app/actions/meal"
import { useRouter } from "next/navigation"

interface MealMatrixProps {
  members: any[]
  meals: any[]
  month: any
  currentUserId: string
  isManager: boolean
}

export function MealMatrix({ members, meals, month, currentUserId, isManager }: MealMatrixProps) {
  const router = useRouter()
  
  const [selectedCell, setSelectedCell] = useState<{
    date: string,
    memberId: string,
    mealId?: string,
    breakfast: number,
    lunch: number,
    dinner: number,
    memberName: string
  } | null>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // 1. Generate Dates
  const uniqueDates = Array.from(new Set(meals.map(m => m.date))).sort((a: any, b: any) => new Date(b).getTime() - new Date(a).getTime())

  // 2. Prepare Data Structure
  const matrix = new Map<string, Map<string, any>>()
  
  uniqueDates.forEach(date => {
      const row = new Map<string, any>()
      members.forEach(member => {
          const meal = meals.find(m => m.date === date && m.user_id === member.user_id)
          row.set(member.user_id, meal || { breakfast: 0, lunch: 0, dinner: 0 })
      })
      matrix.set(date as string, row)
  })


  // Edit Handler
  const handleCellClick = (date: string, member: any, meal: any) => {
      if (!isManager) return
      
      setSelectedCell({
          date,
          memberId: member.user_id,
          mealId: meal?.id,
          breakfast: meal?.breakfast || 0,
          lunch: meal?.lunch || 0,
          dinner: meal?.dinner || 0,
          memberName: member.profiles.name
      })
      setOpen(true)
  }

  const handleDisplaySave = async (e: React.FormEvent) => {
    e.preventDefault()
    if(!selectedCell) return
    setLoading(true)

    const formData = new FormData()
    formData.append("date", selectedCell.date)
    formData.append("memberId", selectedCell.memberId)
    formData.append("breakfast", selectedCell.breakfast.toString())
    formData.append("lunch", selectedCell.lunch.toString())
    formData.append("dinner", selectedCell.dinner.toString())

    const res = await addMeal(formData)
    setLoading(false)
    if(res.error) {
        alert(res.error)
    } else {
        setOpen(false)
        router.refresh()
    }
  }

  const handleDelete = async () => {
      if(!selectedCell?.mealId) return
      if(!confirm("Are you sure you want to delete this meal record?")) return
      
      setLoading(true)
      const res = await deleteMeal(selectedCell.mealId)
      setLoading(false)
      if(res.error) {
          alert(res.error)
      } else {
          setOpen(false)
          router.refresh()
      }
  }

  return (
    <div className="space-y-12">
        
        {/* Daily Cards Section */}
        <section className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" /> Daily Breakdown
                </h2>
                <Button size="sm" className="rounded-full" onClick={() => router.push('/dashboard/add-meal')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Meal Day
                </Button>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {uniqueDates.map(date => {
                    const row = matrix.get(date as string)
                    let dailyTotal = 0
                    
                    return (
                        <Card key={date as string} className="overflow-hidden border-2 border-transparent hover:border-primary/10 transition-colors">
                            <CardHeader className="bg-muted/40 pb-3">
                                <CardTitle className="text-base flex justify-between items-center">
                                    <span>{new Date(date as string).toLocaleDateString("en-GB", { weekday: 'short', day: '2-digit', month: 'short' })}</span>
                                    {/* Calculate Daily Total */}
                                    <span className="text-xs bg-background px-2 py-1 rounded-full border">
                                        Total: {Array.from(row?.values() || []).reduce((acc: number, m: any) => acc + (m.breakfast||0) + (m.lunch||0) + (m.dinner||0), 0)}
                                    </span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y max-h-[300px] overflow-y-auto">
                                    {members.map(member => {
                                        const meal = row?.get(member.user_id)
                                        const total = (meal?.breakfast || 0) + (meal?.lunch || 0) + (meal?.dinner || 0)
                                        if (total === 0) return null // Hide members with 0 meals for compactness? Or show all?
                                        // Show all for better management
                                        
                                        return (
                                            <div 
                                                key={member.user_id} 
                                                className={`flex items-center justify-between p-3 hover:bg-muted/20 cursor-pointer ${!total ? 'opacity-50' : ''}`}
                                                onClick={() => handleCellClick(date as string, member, meal)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={member.profiles?.avatar_url} />
                                                        <AvatarFallback>{member.profiles?.name[0]}</AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-sm font-medium">{member.profiles?.name}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    {meal?.breakfast > 0 && <span className="text-xs font-bold text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded">B:{meal.breakfast}</span>}
                                                    {meal?.lunch > 0 && <span className="text-xs font-bold text-green-600 bg-green-100 px-1.5 py-0.5 rounded">L:{meal.lunch}</span>}
                                                    {meal?.dinner > 0 && <span className="text-xs font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">D:{meal.dinner}</span>}
                                                    {total === 0 && <span className="text-xs text-muted-foreground">-</span>}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
                {uniqueDates.length === 0 && (
                     <div className="col-span-full text-center p-12 border-2 border-dashed rounded-xl text-muted-foreground">
                        No meals recorded for this month.
                     </div>
                )}
            </div>
        </section>

        {/* Monthly Summary Matrix */}
        <section className="space-y-4 pt-4 border-t">
            <h2 className="text-xl font-bold text-muted-foreground">Monthly Summary</h2>
            <Card className="glass-card overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between py-4">
                    <CardTitle className="text-base">Matrix View</CardTitle>
                    <div className="text-xs text-muted-foreground">
                        {isManager ? "Click cell to edit" : "View only"}
                    </div>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                    <div className="min-w-[800px]">
                        {/* Header Row */}
                        <div className="flex border-b bg-muted/40 h-10 items-center">
                            <div className="flex-none w-24 px-3 font-semibold text-xs border-r sticky left-0 bg-background/95 backdrop-blur z-10 h-full flex items-center">
                                Date
                            </div>
                            {members.map(member => (
                                <div key={member.user_id} className="flex-1 min-w-[80px] text-center border-r last:border-r-0 text-xs font-medium truncate px-1" title={member.profiles?.name}>
                                    {member.profiles?.name.split(' ')[0]}
                                </div>
                            ))}
                            <div className="flex-none w-12 text-center font-semibold text-xs h-full flex items-center justify-center">Tot</div>
                        </div>

                        {/* Rows */}
                        {uniqueDates.map(date => {
                            const dateRow = matrix.get(date as string)
                            let dayTotal = 0
                            const displayDate = new Date(date as string).toLocaleDateString("en-GB", { day: '2-digit', month: 'short' })

                            return (
                                <div key={date as string} className="flex border-b last:border-b-0 hover:bg-muted/10 transition-colors h-10 items-center">
                                    <div className="flex-none w-24 px-3 text-xs font-medium border-r sticky left-0 bg-background/95 backdrop-blur z-10 text-muted-foreground h-full flex items-center">
                                        {displayDate}
                                    </div>
                                    {members.map(member => {
                                        const meal = dateRow?.get(member.user_id)
                                        const total = (meal.breakfast || 0) + (meal.lunch || 0) + (meal.dinner || 0)
                                        dayTotal += total
                                        
                                        return (
                                            <div 
                                                key={`${date}-${member.user_id}`} 
                                                onClick={() => handleCellClick(date as string, member, meal)}
                                                className={`flex-1 min-w-[80px] border-r last:border-r-0 flex items-center justify-center text-[10px] cursor-pointer hover:bg-muted/20 h-full ${isManager ? 'hover:text-primary' : ''}`}
                                            >
                                               {(meal?.breakfast || meal?.lunch || meal?.dinner) ? (
                                                  <span className="space-x-1">
                                                     {meal.breakfast > 0 && <span className="text-orange-600">{meal.breakfast}</span>}
                                                     {meal.lunch > 0 && <span className="text-green-600">{meal.lunch}</span>}
                                                     {meal.dinner > 0 && <span className="text-blue-600">{meal.dinner}</span>}
                                                  </span>
                                               ) : <span className="text-muted-foreground/30">-</span>}
                                            </div>
                                        )
                                    })}
                                    <div className="flex-none w-12 text-center font-bold text-xs bg-muted/5 h-full flex items-center justify-center">
                                        {dayTotal}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>
        </section>

    <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Edit Meal</DialogTitle>
                <DialogDescription>
                    {selectedCell?.date && new Date(selectedCell.date).toDateString()} - {selectedCell?.memberName}
                </DialogDescription>
            </DialogHeader>
            
            {selectedCell && (
                <form onSubmit={handleDisplaySave} className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2 text-center">
                            <Label>Breakfast</Label>
                            <Input 
                                type="number" 
                                min="0" 
                                step="0.5"
                                value={selectedCell.breakfast} 
                                onChange={e => setSelectedCell({...selectedCell, breakfast: parseFloat(e.target.value) || 0})}
                                className="text-center"
                            />
                        </div>
                        <div className="space-y-2 text-center">
                            <Label>Lunch</Label>
                            <Input 
                                type="number" 
                                min="0" 
                                step="0.5"
                                value={selectedCell.lunch} 
                                onChange={e => setSelectedCell({...selectedCell, lunch: parseFloat(e.target.value) || 0})}
                                className="text-center"
                            />
                        </div>
                        <div className="space-y-2 text-center">
                            <Label>Dinner</Label>
                            <Input 
                                type="number" 
                                min="0" 
                                step="0.5"
                                value={selectedCell.dinner} 
                                onChange={e => setSelectedCell({...selectedCell, dinner: parseFloat(e.target.value) || 0})}
                                className="text-center"
                            />
                        </div>
                    </div>

                    <DialogFooter className="flex justify-between sm:justify-between items-center mt-6">
                        {selectedCell.mealId && (
                            <Button type="button" variant="destructive" size="icon" onClick={handleDelete} disabled={loading}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                        <div className="flex gap-2 ml-auto">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save Changes"}</Button>
                        </div>
                    </DialogFooter>
                </form>
            )}
        </DialogContent>
    </Dialog>
    </div>
  )
}

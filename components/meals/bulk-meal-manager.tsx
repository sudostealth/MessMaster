"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Minus, Plus, Save, Edit2, RotateCcw } from "lucide-react"
import { getMealsByDate, batchUpsertMeals } from "@/app/actions/meal"
import { toast } from "sonner" // Assuming sonner or use generic alert for now

interface Member {
  user_id: string
  profiles: {
    name: string
    avatar_url: string
  }
}

interface MealState {
  user_id: string
  breakfast: number
  lunch: number
  dinner: number
}

interface BulkMealManagerProps {
  members: Member[]
}

export function BulkMealManager({ members }: BulkMealManagerProps) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [meals, setMeals] = useState<MealState[]>([])
  const [defaults, setDefaults] = useState({ breakfast: 1, lunch: 1, dinner: 1 })
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  
  // Initialize meals state with members
  useEffect(() => {
    // When date changes, fetch existing meals
    const fetchMeals = async () => {
        setFetching(true)
        const existingMeals = await getMealsByDate(date)
        
        const initialMeals = members.map(m => {
            const existing = existingMeals.find((em: any) => em.user_id === m.user_id)
            return {
                user_id: m.user_id,
                breakfast: existing?.breakfast || 0,
                lunch: existing?.lunch || 0,
                dinner: existing?.dinner || 0
            }
        })
        setMeals(initialMeals)
        setFetching(false)
    }
    fetchMeals()
  }, [date, members])

  const updateMeal = (userId: string, type: 'breakfast' | 'lunch' | 'dinner', delta: number) => {
    setMeals(prev => prev.map(m => {
        if (m.user_id !== userId) return m
        const newVal = Math.max(0, (m[type] || 0) + delta)
        return { ...m, [type]: newVal }
    }))
  }

  const applyDefaults = () => {
    if(!confirm("Apply defaults to ALL members? This will overwrite individual changes.")) return
    setMeals(prev => prev.map(m => ({
        ...m,
        breakfast: defaults.breakfast,
        lunch: defaults.lunch,
        dinner: defaults.dinner
    })))
  }

  const handleSave = async () => {
      setLoading(true)
      const res = await batchUpsertMeals(date, meals)
      setLoading(false)
      if (res.error) {
          alert("Error: " + res.error)
      } else {
          alert("Saved successfully!")
      }
  }

  // Calculate Totals
  const totalB = meals.reduce((acc, m) => acc + m.breakfast, 0)
  const totalL = meals.reduce((acc, m) => acc + m.lunch, 0)
  const totalD = meals.reduce((acc, m) => acc + m.dinner, 0)

  return (
    <div className="space-y-6">
        {/* Top Controls */}
        <div className="flex flex-col md:flex-row gap-4 items-end justify-between bg-muted/20 p-4 rounded-lg border">
            <div className="space-y-2 w-full md:w-auto">
                <Label>Date</Label>
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            
            <div className="flex flex-1 gap-4 items-end bg-background p-3 rounded border w-full">
                <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Default B</Label>
                    <Input type="number" className="h-8 w-16" value={defaults.breakfast} onChange={e => setDefaults({...defaults, breakfast: parseFloat(e.target.value)||0})} />
                </div>
                <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Default L</Label>
                    <Input type="number" className="h-8 w-16" value={defaults.lunch} onChange={e => setDefaults({...defaults, lunch: parseFloat(e.target.value)||0})} />
                </div>
                <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Default D</Label>
                    <Input type="number" className="h-8 w-16" value={defaults.dinner} onChange={e => setDefaults({...defaults, dinner: parseFloat(e.target.value)||0})} />
                </div>
                <Button variant="secondary" size="sm" onClick={applyDefaults} className="ml-auto">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Set All
                </Button>
            </div>
        </div>

        {/* Member List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {meals.map((meal, idx) => {
                const member = members.find(m => m.user_id === meal.user_id)
                if(!member) return null

                // Safe access to profile name
                const memberName = member.profiles?.name || "Unknown Member"
                const firstName = memberName.split(' ')[0]

                return (
                    <Card key={meal.user_id} className="overflow-hidden">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3 mb-4">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={member.profiles?.avatar_url} />
                                    <AvatarFallback>{memberName[0]}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-sm truncate">{memberName}</h4>
                                    <p className="text-xs text-muted-foreground">Total: {meal.breakfast + meal.lunch + meal.dinner}</p>
                                </div>
                            </div>
                            
                            <div className="space-y-3">
                                <MealCounter label="Breakfast" value={meal.breakfast} onChange={(d) => updateMeal(meal.user_id, 'breakfast', d)} color="orange" />
                                <MealCounter label="Lunch" value={meal.lunch} onChange={(d) => updateMeal(meal.user_id, 'lunch', d)} color="green" />
                                <MealCounter label="Dinner" value={meal.dinner} onChange={(d) => updateMeal(meal.user_id, 'dinner', d)} color="blue" />
                            </div>
                        </CardContent>
                    </Card>
                )
            })}
        </div>

        {/* Floating Footer / Submit Area */}
        <div className="sticky bottom-4 z-10 mx-auto w-full max-w-2xl">
             <div className="bg-background/95 backdrop-blur border rounded-full shadow-lg p-2 px-6 flex items-center justify-between gap-4">
                  <div className="flex gap-4 text-sm font-medium">
                      <span className="text-orange-600">B: {totalB}</span>
                      <span className="text-green-600">L: {totalL}</span>
                      <span className="text-blue-600">D: {totalD}</span>
                  </div>
                  <Button onClick={handleSave} disabled={loading || fetching} className="rounded-full px-8">
                      {loading ? "Saving..." : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Update
                          </>
                      )}
                  </Button>
             </div>
        </div>
    </div>
  )
}

function MealCounter({ label, value, onChange, color }: { label: string, value: number, onChange: (d: number) => void, color: string }) {
    const bgColor = {
        orange: 'bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400',
        green: 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400',
        blue: 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400',
    }[color]

    return (
        <div className={`flex items-center justify-between p-2 rounded-md ${bgColor}`}>
            <span className="text-xs font-medium w-16">{label}</span>
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-black/10" onClick={() => onChange(-0.5)}>
                    <Minus className="h-3 w-3" />
                </Button>
                <span className="font-bold w-6 text-center text-sm">{value}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-black/10" onClick={() => onChange(0.5)}>
                    <Plus className="h-3 w-3" />
                </Button>
            </div>
        </div>
    )
}

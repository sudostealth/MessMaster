"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { addMeal, getMessMembers } from "@/app/actions/meal"
import { BulkMealManager } from "@/components/meals/bulk-meal-manager"
import { Calendar, ChevronDown, User, Utensils } from "lucide-react"
import { motion } from "framer-motion"

export default function AddMealPage() {
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
      getMessMembers().then(setMembers)
  }, [])

  const handleSingleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const formData = new FormData(e.currentTarget)
    const result = await addMeal(formData)
    if (result?.error) setError(result.error)
    else {
      // Basic success feedback, could be improved with toast
      const form = e.target as HTMLFormElement;
      form.reset();
      alert("Meal added successfully")
    }
    setLoading(false)
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Add Meal</h1>
          <p className="text-muted-foreground">Record daily meals for members.</p>
        </div>
      </motion.div>

      <Tabs defaultValue="bulk" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2 p-1 bg-muted/50 backdrop-blur-sm rounded-xl h-12">
            <TabsTrigger value="bulk" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-300">Bulk Entry</TabsTrigger>
            <TabsTrigger value="single" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-300">Single Entry</TabsTrigger>
        </TabsList>

        <TabsContent value="bulk" className="space-y-4">
            <BulkMealManager members={members} />
        </TabsContent>

        <TabsContent value="single">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="glass-card border-none shadow-xl">
              <CardHeader className="pb-4 border-b border-border/50">
                <CardTitle className="text-xl flex items-center gap-2">
                   <Utensils className="h-5 w-5 text-primary" />
                   Single Member Entry
                </CardTitle>
                <CardDescription>Record specific meal count for a chosen date.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleSingleSubmit} className="space-y-6">
                   <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                          <Label htmlFor="date" className="text-foreground/80 font-medium">Date</Label>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                            <Input
                              id="date"
                              name="date"
                              type="date"
                              defaultValue={today}
                              required
                              className="pl-10 bg-background/50 focus:bg-background transition-colors h-11"
                            />
                          </div>
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="member" className="text-foreground/80 font-medium">Member</Label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                            <select
                                id="member"
                                name="memberId"
                                className="flex h-11 w-full appearance-none rounded-md border border-input bg-background/50 pl-10 pr-8 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 hover:bg-background"
                                required
                            >
                                <option value="">Select Member</option>
                                {members.map((m: any) => (
                                    <option key={m.user_id} value={m.user_id}>{m.profiles?.name}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none opacity-50" />
                          </div>
                      </div>
                   </div>

                   <div className="p-6 rounded-xl bg-secondary/30 border border-border/50 space-y-4">
                       <Label className="text-base font-semibold">Meal Count</Label>
                       <div className="grid grid-cols-3 gap-6">
                          <div className="space-y-2">
                              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Breakfast</Label>
                              <Input name="breakfast" type="number" step="0.5" defaultValue="0" min="0" className="h-12 text-center text-lg font-mono bg-background" />
                          </div>
                          <div className="space-y-2">
                              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Lunch</Label>
                              <Input name="lunch" type="number" step="0.5" defaultValue="0" min="0" className="h-12 text-center text-lg font-mono bg-background" />
                          </div>
                          <div className="space-y-2">
                              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Dinner</Label>
                              <Input name="dinner" type="number" step="0.5" defaultValue="0" min="0" className="h-12 text-center text-lg font-mono bg-background" />
                          </div>
                       </div>
                   </div>

                  {error && <p className="text-sm text-destructive font-medium text-center">{error}</p>}

                  <div className="flex justify-end pt-2">
                    <Button type="submit" size="lg" className="w-full md:w-auto min-w-[150px] shadow-lg shadow-primary/20" disabled={loading}>
                      {loading ? "Saving..." : "Save Record"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

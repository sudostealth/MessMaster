"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { addMeal, getMessMembers } from "@/app/actions/meal"
import { BulkMealManager } from "@/components/meals/bulk-meal-manager"

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
    else alert("Meal added successfully")
    setLoading(false)
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="max-w-4xl mx-auto py-10 space-y-8">
      <h1 className="text-2xl font-bold">Add Meal</h1>
      <Tabs defaultValue="bulk">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="bulk">Bulk Entry (Advanced)</TabsTrigger>
            <TabsTrigger value="single">Single Member</TabsTrigger>
        </TabsList>

        <TabsContent value="bulk">
            <BulkMealManager members={members} />
        </TabsContent>

        <TabsContent value="single">
          <Card>
            <CardHeader>
              <CardTitle>Single Entry</CardTitle>
              <CardDescription>Record meal count for a specific date.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSingleSubmit} className="space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="date">Date</Label>
                        <Input id="date" name="date" type="date" defaultValue={today} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="member">Member</Label>
                        <select id="member" name="memberId" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" required>
                            <option value="">Select Member</option>
                            {members.map((m: any) => (
                                <option key={m.user_id} value={m.user_id}>{m.profiles?.name}</option>
                            ))}
                        </select>
                    </div>
                 </div>
                 
                 <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label>Breakfast</Label>
                        <Input name="breakfast" type="number" step="0.5" defaultValue="0" min="0" />
                    </div>
                    <div className="space-y-2">
                        <Label>Lunch</Label>
                        <Input name="lunch" type="number" step="0.5" defaultValue="0" min="0" />
                    </div>
                    <div className="space-y-2">
                        <Label>Dinner</Label>
                        <Input name="dinner" type="number" step="0.5" defaultValue="0" min="0" />
                    </div>
                 </div>

                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Saving..." : "Save Meal"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}


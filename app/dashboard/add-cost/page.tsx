"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs"
import { addCost } from "@/app/actions/finance"
import { getMessMembers } from "@/app/actions/meal"

export default function AddCostPage() {
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  
  useEffect(() => { getMessMembers().then(setMembers) }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>, category: string) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    formData.append("category", category)
    const res = await addCost(formData)
    if(res.error) alert(res.error)
    else alert("Cost Added Successfully")
    setLoading(false)
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="max-w-2xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Add Expense</h1>
      <Tabs defaultValue="meal" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="meal">Meal Cost</TabsTrigger>
          <TabsTrigger value="shared">Shared Cost</TabsTrigger>
          <TabsTrigger value="individual">Individual Cost</TabsTrigger>
        </TabsList>

        {/* MEAL COST TAB */}
        <TabsContent value="meal">
          <Card>
            <CardHeader><CardTitle>Add Meal Cost (Bazar)</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={(e) => handleSubmit(e, 'meal')} className="space-y-4">
                <div className="space-y-2">
                   <Label>Date</Label>
                   <Input name="date" type="date" defaultValue={today} required />
                </div>
                <div className="space-y-2">
                   <Label>Shoppers (Select one or more)</Label>
                   <div className="h-32 overflow-y-auto border rounded-md p-2 space-y-2 bg-background">
                       {members.map((m: any) => (
                           <div key={m.user_id} className="flex items-center space-x-2 p-1 hover:bg-muted/50 rounded">
                               <input type="checkbox" name="shopperIds" value={m.user_id} id={`shopper-${m.user_id}`} className="accent-primary h-4 w-4" />
                               <label htmlFor={`shopper-${m.user_id}`} className="text-sm cursor-pointer select-none flex-1">{m.profiles?.name}</label>
                           </div>
                       ))}
                   </div>
                </div>
                <div className="space-y-2">
                   <Label>Amount</Label>
                   <Input name="amount" type="number" min="0" required />
                </div>
                <div className="space-y-2">
                   <Label>Details</Label>
                   <Textarea name="details" placeholder="e.g. Rice, Chicken, Oil" required/>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>Save Meal Cost</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SHARED COST TAB */}
        <TabsContent value="shared">
           <Card>
             <CardHeader><CardTitle>Shared Cost (Split All)</CardTitle></CardHeader>
             <CardContent>
                <form onSubmit={(e) => handleSubmit(e, 'shared')} className="space-y-4">
                    <p className="text-sm text-muted-foreground">This amount will be divided equally among SELECTED members.</p>
                    <div className="space-y-2">
                        <Label>Date</Label>
                        <Input name="date" type="date" defaultValue={today} required />
                    </div>
                    <div className="space-y-2">
                       <Label>Paid By</Label>
                       <select name="shopperId" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" required>
                         <option value="">Select Member</option>
                         {members.map((m: any) => (
                            <option key={m.user_id} value={m.user_id}>{m.profiles?.name}</option>
                         ))}
                       </select>
                    </div>
                    
                    <div className="space-y-2">
                       <Label>Allocated To (Members who share this cost)</Label>
                       <div className="h-32 overflow-y-auto border rounded-md p-2 space-y-2 bg-background">
                           {members.map((m: any) => (
                               <div key={m.user_id} className="flex items-center space-x-2 p-1 hover:bg-muted/50 rounded">
                                   <input type="checkbox" name="allocatedMemberIds" value={m.user_id} id={`alloc-${m.user_id}`} className="accent-primary h-4 w-4" defaultChecked />
                                   <label htmlFor={`alloc-${m.user_id}`} className="text-sm cursor-pointer select-none flex-1">{m.profiles?.name}</label>
                               </div>
                           ))}
                       </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Amount</Label>
                        <Input name="amount" type="number" min="0" required />
                    </div>
                    <div className="space-y-2">
                        <Label>Details</Label>
                        <Textarea name="details" placeholder="e.g. WiFi Bill" required/>
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>Save Shared Cost</Button>
                </form>
             </CardContent>
           </Card>
        </TabsContent>

        {/* INDIVIDUAL COST TAB */}
        <TabsContent value="individual">
           <Card>
             <CardHeader><CardTitle>Individual Cost</CardTitle></CardHeader>
             <CardContent>
                <form onSubmit={(e) => handleSubmit(e, 'individual')} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Date</Label>
                        <Input name="date" type="date" defaultValue={today} required />
                    </div>
                    <div className="space-y-2">
                       <Label>Paid By</Label>
                       <select name="shopperId" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" required>
                         <option value="">Select Member</option>
                         {members.map((m: any) => (
                            <option key={m.user_id} value={m.user_id}>{m.profiles?.name}</option>
                         ))}
                       </select>
                    </div>
                    <div className="space-y-2">
                       <Label>Allocated To (Member who owes)</Label>
                       <select name="memberId" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" required>
                         <option value="">Select Member</option>
                         {members.map((m: any) => (
                            <option key={m.user_id} value={m.user_id}>{m.profiles?.name}</option>
                         ))}
                       </select>
                    </div>
                    <div className="space-y-2">
                        <Label>Amount</Label>
                        <Input name="amount" type="number" min="0" required />
                    </div>
                    <div className="space-y-2">
                        <Label>Details</Label>
                        <Textarea name="details" placeholder="e.g. Personal Fine" required/>
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>Save Individual Cost</Button>
                </form>
             </CardContent>
           </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

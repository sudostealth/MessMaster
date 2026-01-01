"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { addDeposit } from "@/app/actions/finance"
import { getMessMembers } from "@/app/actions/meal"

export default function AddDepositPage() {
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  
  useEffect(() => { getMessMembers().then(setMembers) }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const res = await addDeposit(formData)
    if(res.error) alert(res.error)
    else alert("Deposit Added")
    setLoading(false)
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="max-w-md mx-auto py-10">
      <Card>
        <CardHeader><CardTitle>Add Deposit</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
               <Label>Date</Label>
               <Input name="date" type="date" defaultValue={today} required />
            </div>
            <div className="space-y-2">
               <Label>Member</Label>
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
               <Label>Details (Optional)</Label>
               <Input name="details" placeholder="e.g. Bkash/Cash" />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>Save Deposit</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

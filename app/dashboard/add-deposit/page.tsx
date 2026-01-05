"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { addDeposit, addBorrow } from "@/app/actions/finance"
import { getMessMembers } from "@/app/actions/meal"
import { Calendar, ChevronDown, User, Wallet, ArrowDownLeft } from "lucide-react"
import { motion } from "framer-motion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"

export default function AddDepositPage() {
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const today = new Date().toISOString().split('T')[0]
  
  useEffect(() => { getMessMembers().then(setMembers) }, [])

  const handleDepositSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const res = await addDeposit(formData)
    if(res.error) toast.error(res.error)
    else {
        toast.success("Deposit Added Successfully")
        const form = e.target as HTMLFormElement
        form.reset()
    }
    setLoading(false)
  }

  const handleBorrowSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const res = await addBorrow(formData)
    if(res.error) toast.error(res.error)
    else {
        toast.success("Borrow Recorded Successfully")
        const form = e.target as HTMLFormElement
        form.reset()
    }
    setLoading(false)
  }

  return (
    <div className="max-w-xl mx-auto py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Tabs defaultValue="deposit" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="deposit">Add Deposit</TabsTrigger>
                <TabsTrigger value="borrow">Borrow Money</TabsTrigger>
            </TabsList>

            <TabsContent value="deposit">
                <Card className="glass-card border-none shadow-xl">
                    <CardHeader className="pb-4 border-b border-border/50">
                        <CardTitle className="flex items-center gap-2 text-2xl">
                            <Wallet className="h-6 w-6 text-green-500" />
                            Add Deposit
                        </CardTitle>
                        <CardDescription>Record member deposits into the mess fund.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                    <form onSubmit={handleDepositSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label className="font-medium">Date</Label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                                <Input name="date" type="date" defaultValue={today} required className="pl-10 bg-background/50 h-11" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="font-medium">Member</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                                <select name="memberId" className="flex h-11 w-full appearance-none rounded-md border border-input bg-background/50 pl-10 pr-8 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-background" required>
                                    <option value="">Select Member</option>
                                    {members.map((m: any) => (
                                        <option key={m.user_id} value={m.user_id}>{m.profiles?.name}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-3.5 h-4 w-4 text-muted-foreground pointer-events-none opacity-50" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="font-medium">Amount</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-3 text-muted-foreground font-semibold">৳</span>
                                <Input name="amount" type="number" min="0" step="0.01" required className="pl-8 bg-background/50 h-11 text-lg font-medium" placeholder="0.00" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="font-medium">Details (Optional)</Label>
                            <Input name="details" placeholder="e.g. Bkash, Cash, Bank Transfer" className="bg-background/50 h-11" />
                        </div>

                        <Button type="submit" size="lg" disabled={loading} className="w-full shadow-lg shadow-green-500/20 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0 mt-4">
                            {loading ? "Processing..." : "Confirm Deposit"}
                        </Button>
                    </form>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="borrow">
                <Card className="glass-card border-none shadow-xl">
                    <CardHeader className="pb-4 border-b border-border/50">
                        <CardTitle className="flex items-center gap-2 text-2xl">
                            <ArrowDownLeft className="h-6 w-6 text-red-500" />
                            Borrow Money
                        </CardTitle>
                        <CardDescription>Record money borrowed by a member from the mess.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                    <form onSubmit={handleBorrowSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label className="font-medium">Date</Label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                                <Input name="date" type="date" defaultValue={today} required className="pl-10 bg-background/50 h-11" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="font-medium">Member</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                                <select name="memberId" className="flex h-11 w-full appearance-none rounded-md border border-input bg-background/50 pl-10 pr-8 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-background" required>
                                    <option value="">Select Member</option>
                                    {members.map((m: any) => (
                                        <option key={m.user_id} value={m.user_id}>{m.profiles?.name}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-3.5 h-4 w-4 text-muted-foreground pointer-events-none opacity-50" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="font-medium">Amount</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-3 text-muted-foreground font-semibold">৳</span>
                                <Input name="amount" type="number" min="0" step="0.01" required className="pl-8 bg-background/50 h-11 text-lg font-medium" placeholder="0.00" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="font-medium">Details (Optional)</Label>
                            <Input name="details" placeholder="Reason for borrowing..." className="bg-background/50 h-11" />
                        </div>

                        <Button type="submit" size="lg" disabled={loading} className="w-full shadow-lg shadow-red-500/20 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white border-0 mt-4">
                            {loading ? "Processing..." : "Confirm Borrow"}
                        </Button>
                    </form>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}

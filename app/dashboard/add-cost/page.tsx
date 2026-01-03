"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { addCost } from "@/app/actions/finance"
import { getMessMembers } from "@/app/actions/meal"
import { Calendar, Check, ChevronDown, DollarSign, ShoppingBag, User, Users } from "lucide-react"
import { motion } from "framer-motion"

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
    else {
        alert("Cost Added Successfully")
        const form = e.target as HTMLFormElement
        form.reset()
    }
    setLoading(false)
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Add Expense</h1>
          <p className="text-muted-foreground mt-1">Record purchases and bills for the mess.</p>
      </motion.div>

      <Tabs defaultValue="meal" className="w-full space-y-6">
        <TabsList className="grid w-full grid-cols-3 p-1 bg-muted/50 backdrop-blur-sm rounded-xl h-12">
          <TabsTrigger value="meal" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-300">Meal Cost</TabsTrigger>
          <TabsTrigger value="shared" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-300">Shared Cost</TabsTrigger>
          <TabsTrigger value="individual" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-300">Individual</TabsTrigger>
        </TabsList>

        {/* MEAL COST TAB */}
        <TabsContent value="meal">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="glass-card border-none shadow-xl">
                <CardHeader className="pb-4 border-b border-border/50">
                    <CardTitle className="flex items-center gap-2">
                        <ShoppingBag className="h-5 w-5 text-orange-500" />
                        Daily Shopping (Bazar)
                    </CardTitle>
                    <CardDescription>Cost for daily meal ingredients.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                <form onSubmit={(e) => handleSubmit(e, 'meal')} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="font-medium">Date</Label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                <Input name="date" type="date" defaultValue={today} required className="pl-10 bg-background/50 h-11" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="font-medium">Amount</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">৳</span>
                                <Input name="amount" type="number" min="0" required className="pl-8 bg-background/50 h-11" placeholder="0.00" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="font-medium">Shoppers (Who went to market?)</Label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 bg-secondary/20 rounded-xl border border-border/50 max-h-48 overflow-y-auto">
                            {members.map((m: any) => (
                                <label key={m.user_id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-background/80 cursor-pointer transition-colors border border-transparent hover:border-border/50">
                                    <div className="relative flex items-center">
                                        <input type="checkbox" name="shopperIds" value={m.user_id} className="peer h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/20" />
                                    </div>
                                    <span className="text-sm font-medium">{m.profiles?.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <Label className="font-medium">Details</Label>
                        <Textarea name="details" placeholder="e.g. Rice 5kg, Chicken 2kg, Oil 1L" required className="bg-background/50 min-h-[100px]" />
                    </div>

                    <div className="flex justify-end pt-2">
                         <Button type="submit" size="lg" disabled={loading} className="w-full md:w-auto min-w-[150px] shadow-lg shadow-orange-500/20 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-0">
                             {loading ? "Saving..." : "Save Meal Cost"}
                         </Button>
                    </div>
                </form>
                </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* SHARED COST TAB */}
        <TabsContent value="shared">
           <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
             <Card className="glass-card border-none shadow-xl">
                <CardHeader className="pb-4 border-b border-border/50">
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-blue-500" />
                        Shared Expense
                    </CardTitle>
                    <CardDescription>Utilities or items shared by multiple members.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                    <form onSubmit={(e) => handleSubmit(e, 'shared')} className="space-y-6">
                        <div className="p-3 bg-blue-500/10 text-blue-600 rounded-lg text-sm border border-blue-500/20">
                            This amount will be divided equally among <strong>SELECTED</strong> members below.
                        </div>

                        <div className="space-y-2">
                            <Label className="font-medium">Date</Label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                <Input name="date" type="date" defaultValue={today} required className="pl-10 bg-background/50 h-11" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="font-medium">Allocated To (Members sharing cost)</Label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 bg-secondary/20 rounded-xl border border-border/50 max-h-48 overflow-y-auto">
                                {members.map((m: any) => (
                                    <label key={m.user_id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-background/80 cursor-pointer transition-colors border border-transparent hover:border-border/50">
                                        <div className="relative flex items-center">
                                            <input type="checkbox" name="allocatedMemberIds" value={m.user_id} defaultChecked className="peer h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500/20" />
                                        </div>
                                        <span className="text-sm font-medium">{m.profiles?.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="font-medium">Amount</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">৳</span>
                                <Input name="amount" type="number" min="0" required className="pl-8 bg-background/50 h-11" placeholder="0.00" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="font-medium">Details</Label>
                            <Textarea name="details" placeholder="e.g. WiFi Bill, Gas Cylinder" required className="bg-background/50 min-h-[80px]" />
                        </div>

                        <div className="flex justify-end pt-2">
                             <Button type="submit" size="lg" disabled={loading} className="w-full md:w-auto min-w-[150px] shadow-lg shadow-blue-500/20 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white border-0">
                                 {loading ? "Saving..." : "Save Shared Cost"}
                             </Button>
                        </div>
                    </form>
                 </CardContent>
             </Card>
           </motion.div>
        </TabsContent>

        {/* INDIVIDUAL COST TAB */}
        <TabsContent value="individual">
           <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
             <Card className="glass-card border-none shadow-xl">
                <CardHeader className="pb-4 border-b border-border/50">
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5 text-purple-500" />
                        Individual Expense
                    </CardTitle>
                    <CardDescription>Cost incurred by a specific member.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                    <form onSubmit={(e) => handleSubmit(e, 'individual')} className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="font-medium">Date</Label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                    <Input name="date" type="date" defaultValue={today} required className="pl-10 bg-background/50 h-11" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="font-medium">Amount</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">৳</span>
                                    <Input name="amount" type="number" min="0" required className="pl-8 bg-background/50 h-11" placeholder="0.00" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="font-medium">Allocated To (Who owes?)</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                <select name="memberId" className="flex h-11 w-full appearance-none rounded-md border border-input bg-background/50 pl-10 pr-8 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-background" required>
                                    <option value="">Select Member</option>
                                    {members.map((m: any) => (
                                        <option key={m.user_id} value={m.user_id}>{m.profiles?.name}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none opacity-50" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="font-medium">Details</Label>
                            <Textarea name="details" placeholder="e.g. Personal items, fines" required className="bg-background/50 min-h-[80px]" />
                        </div>

                        <div className="flex justify-end pt-2">
                            <Button type="submit" size="lg" disabled={loading} className="w-full md:w-auto min-w-[150px] shadow-lg shadow-purple-500/20 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0">
                                {loading ? "Saving..." : "Save Individual Cost"}
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

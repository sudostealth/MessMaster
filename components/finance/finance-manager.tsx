"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Trash2, Pencil, Plus, MoreVertical, Wallet, ShoppingCart, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { deleteDeposit, deleteExpense, updateDeposit, updateExpense } from "@/app/actions/finance"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface FinanceManagerProps {
  expenses: any[]
  deposits: any[]
  currentUserId: string
  isManager: boolean
}

export function FinanceManager({ expenses, deposits, currentUserId, isManager }: FinanceManagerProps) {
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [editType, setEditType] = useState<"deposit" | "expense">("deposit")

  // Categorize Expenses
  const mealCosts = expenses.filter(e => e.category === "meal")
  const otherCosts = expenses.filter(e => e.category !== "meal")

  // Totals
  const totalDeposits = deposits.reduce((sum, d) => sum + d.amount, 0)
  const totalMealCost = mealCosts.reduce((sum, e) => sum + e.amount, 0)
  const totalOtherCost = otherCosts.reduce((sum, e) => sum + e.amount, 0)

  const handleDeleteDeposit = async (id: string) => {
      if(!confirm("Are you sure you want to delete this deposit?")) return
      setLoading(true)
      const res = await deleteDeposit(id)
      setLoading(false)
      if(res.error) alert(res.error)
  }

  const handleDeleteExpense = async (id: string) => {
      if(!confirm("Are you sure you want to delete this expense?")) return
      setLoading(true)
      const res = await deleteExpense(id)
      setLoading(false)
      if(res.error) alert(res.error)
  }

  const handleEditClick = (item: any, type: "deposit" | "expense") => {
      setSelectedItem(item)
      setEditType(type)
      setEditOpen(true)
  }

  const handleUpdate = async (e: React.FormEvent) => {
      e.preventDefault()
      if(!selectedItem) return
      setLoading(true)
      
      const formData = new FormData()
      formData.append("id", selectedItem.id)
      formData.append("amount", selectedItem.amount)
      formData.append("date", selectedItem.date)
      formData.append("details", selectedItem.details || "")
      
      let res
      if(editType === "deposit") {
          res = await updateDeposit(formData)
      } else {
          res = await updateExpense(formData)
      }

      setLoading(false)
      if(res.error) {
          alert(res.error)
      } else {
          setEditOpen(false)
          setSelectedItem(null)
      }
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-20">
      <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Finance Hub</h1>
            <p className="text-sm text-muted-foreground">Manage deposits & expenses</p>
          </div>
          <Button className="rounded-full h-10 px-4" onClick={() => router.push('/dashboard/add-cost')}>
                <Plus className="h-4 w-4 mr-2" />
                Add New
          </Button>
      </div>

      <Tabs defaultValue="deposit" className="w-full space-y-6">
          <TabsList className="grid grid-cols-3 w-full p-1 bg-muted/40 rounded-xl h-12">
             <TabsTrigger value="deposit" className="rounded-lg">Deposit</TabsTrigger>
             <TabsTrigger value="meal_cost" className="rounded-lg">Meal Cost</TabsTrigger>
             <TabsTrigger value="other_cost" className="rounded-lg">Other</TabsTrigger>
          </TabsList>

          <TabsContent value="deposit" className="space-y-4">
             <TotalCard title="Total Deposits" amount={totalDeposits} icon={<Wallet className="h-5 w-5 text-green-600"/>} />
             <div className="space-y-3">
                {deposits.map((d: any) => (
                    <TransactionCard 
                        key={d.id} 
                        item={d} 
                        type="deposit" 
                        onEdit={() => handleEditClick(d, "deposit")} 
                        onDelete={() => handleDeleteDeposit(d.id)}
                        isManager={isManager}
                    />
                ))}
                {deposits.length === 0 && <EmptyState message="No deposits recorded." />}
            </div>
          </TabsContent>
          
          <TabsContent value="meal_cost" className="space-y-4">
             <TotalCard title="Total Meal Cost" amount={totalMealCost} icon={<ShoppingCart className="h-5 w-5 text-orange-600"/>} />
             <div className="space-y-3">
                {mealCosts.map((e: any) => (
                    <TransactionCard 
                        key={e.id} 
                        item={e} 
                        type="expense" 
                        color="text-orange-600"
                        onEdit={() => handleEditClick(e, "expense")} 
                        onDelete={() => handleDeleteExpense(e.id)}
                        isManager={isManager}
                    />
                ))}
                {mealCosts.length === 0 && <EmptyState message="No meal costs recorded." />}
            </div>
          </TabsContent>

          <TabsContent value="other_cost" className="space-y-4">
             <TotalCard title="Total Other Cost" amount={totalOtherCost} icon={<Users className="h-5 w-5 text-blue-600"/>} />
             <div className="space-y-3">
                {otherCosts.map((e: any) => (
                    <TransactionCard 
                        key={e.id} 
                        item={e} 
                        type="expense" 
                        color="text-blue-600"
                        onEdit={() => handleEditClick(e, "expense")} 
                        onDelete={() => handleDeleteExpense(e.id)}
                        isManager={isManager}
                    />
                ))}
                {otherCosts.length === 0 && <EmptyState message="No other costs recorded." />}
            </div>
          </TabsContent>
      </Tabs>

        {/* Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit {editType === "deposit" ? "Deposit" : "Expense"}</DialogTitle>
                </DialogHeader>
                {selectedItem && (
                    <form onSubmit={handleUpdate} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Date</Label>
                            <Input 
                                type="date" 
                                required 
                                value={selectedItem.date} 
                                onChange={e => setSelectedItem({...selectedItem, date: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Amount</Label>
                            <Input 
                                type="number" 
                                required 
                                step="0.01"
                                value={selectedItem.amount} 
                                onChange={e => setSelectedItem({...selectedItem, amount: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Details</Label>
                            <Textarea 
                                required 
                                value={selectedItem.details} 
                                onChange={e => setSelectedItem({...selectedItem, details: e.target.value})}
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={loading}>Save Changes</Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    </div>
  )
}

function TotalCard({ title, amount, icon }: { title: string, amount: number, icon: React.ReactNode }) {
    return (
        <Card className="bg-gradient-to-br from-background to-muted/20 border-primary/10">
            <CardContent className="p-6 flex items-center justify-between">
                <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        {icon} {title}
                    </p>
                    <h2 className="text-3xl font-bold tracking-tight">৳{amount.toLocaleString()}</h2>
                </div>
            </CardContent>
        </Card>
    )
}

function TransactionCard({ item, type, color = "text-green-600", onEdit, onDelete, isManager }: any) {
    const isDeposit = type === "deposit"
    const name = item.profiles?.name || "Unknown"
    const avatar = item.profiles?.avatar_url
    
    return (
        <Card className="hover:shadow transition-shadow overflow-hidden group">
            <div className="p-4 flex items-center gap-4">
                <Avatar className="h-10 w-10 border">
                    <AvatarImage src={avatar} />
                    <AvatarFallback>{name[0]}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0 grid gap-0.5">
                    <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm truncate pr-2">{name}</h4>
                        <span className={`font-mono font-bold ${color}`}>৳{item.amount}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="truncate pr-2">{item.details}</span>
                        <span className="shrink-0">{new Date(item.date).toLocaleDateString()}</span>
                    </div>
                </div>

                {isManager && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                             <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2">
                                <MoreVertical className="h-4 w-4" />
                             </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={onEdit}>
                                <Pencil className="h-4 w-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={onDelete}>
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
        </Card>
    )
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed rounded-xl bg-muted/10">
            <p className="text-muted-foreground text-sm">{message}</p>
        </div>
    )
}




"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/contexts/language-context"
import { TrendingUp, TrendingDown, Trash2, Edit2, MoreHorizontal } from "lucide-react"
import { deleteDeposit, deleteExpense } from "@/app/actions/finance"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"

export function FinanceManager({ expenses, deposits, currentUserId, isManager }: { expenses: any[], deposits: any[], currentUserId: string, isManager: boolean }) {
  const { t } = useLanguage()
  const [loading, setLoading] = useState<string | null>(null)

  const totalExpenses = expenses.reduce((acc, curr) => acc + Number(curr.amount), 0)
  const totalDeposits = deposits.reduce((acc, curr) => acc + Number(curr.amount), 0)
  const balance = totalDeposits - totalExpenses

  const handleDeleteDeposit = async (id: string) => {
      if(!confirm("Are you sure you want to delete this deposit?")) return
      setLoading(id)
      const res = await deleteDeposit(id)
      setLoading(null)
      if(res.error) toast.error(res.error)
      else toast.success("Deposit deleted")
  }

  const handleDeleteExpense = async (id: string) => {
      if(!confirm("Are you sure you want to delete this expense?")) return
      setLoading(id)
      const res = await deleteExpense(id)
      setLoading(null)
      if(res.error) toast.error(res.error)
      else toast.success("Expense deleted")
  }

  // Helper for rendering actions menu
  const ActionMenu = ({ id, type, onDelete }: { id: string, type: 'deposit' | 'expense', onDelete: (id: string) => void }) => {
      if (!isManager) return null
      return (
          <DropdownMenu>
              <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                  </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                  {/* Edit could be a dialog trigger, skipping for simple delete restore now */}
                  <DropdownMenuItem className="text-red-600 focus:text-red-700" onClick={() => onDelete(id)}>
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </DropdownMenuItem>
              </DropdownMenuContent>
          </DropdownMenu>
      )
  }

  return (
    <div className="space-y-6">
       <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
              <h2 className="text-3xl font-bold tracking-tight text-gradient">{t("finance")}</h2>
              <p className="text-muted-foreground">{t("balance")}: <span className={balance >= 0 ? "text-green-500" : "text-red-500"}>{balance.toFixed(2)}</span></p>
          </div>
       </div>

       <div className="grid gap-4 md:grid-cols-2">
           <Card className="glass-card">
               <CardHeader className="flex flex-row items-center justify-between pb-2">
                   <CardTitle className="text-sm font-medium text-muted-foreground">{t("total_expenses")}</CardTitle>
                   <TrendingDown className="h-4 w-4 text-red-500" />
               </CardHeader>
               <CardContent>
                   <div className="text-2xl font-bold">{totalExpenses.toFixed(2)}</div>
               </CardContent>
           </Card>
           <Card className="glass-card">
               <CardHeader className="flex flex-row items-center justify-between pb-2">
                   <CardTitle className="text-sm font-medium text-muted-foreground">{t("total_deposits")}</CardTitle>
                   <TrendingUp className="h-4 w-4 text-green-500" />
               </CardHeader>
               <CardContent>
                   <div className="text-2xl font-bold">{totalDeposits.toFixed(2)}</div>
               </CardContent>
           </Card>
       </div>

       <Tabs defaultValue="meal_cost" className="w-full">
           <TabsList className="grid w-full grid-cols-3">
               <TabsTrigger value="meal_cost">{t("meal_cost")}</TabsTrigger>
               <TabsTrigger value="other_cost">{t("other_cost")}</TabsTrigger>
               <TabsTrigger value="deposits">{t("deposits")}</TabsTrigger>
           </TabsList>

           <TabsContent value="meal_cost" className="space-y-4 mt-4">
               {expenses.filter(e => e.category === 'meal').length === 0 ? (
                   <div className="text-center py-10 text-muted-foreground border border-dashed rounded-lg">{t("no_records")}</div>
               ) : (
                   expenses.filter(e => e.category === 'meal').map((expense) => (
                       <div key={expense.id} className="flex items-center justify-between p-4 rounded-lg bg-card border glass hover:bg-muted/50 transition-colors">
                           <div className="flex items-center gap-4">
                               <div className="p-2 rounded-full bg-orange-500/10 text-orange-500">
                                   <TrendingDown className="h-4 w-4" />
                               </div>
                               <div>
                                   <p className="font-medium text-sm">{expense.details || expense.category}</p>
                                   <p className="text-xs text-muted-foreground">
                                       {format(new Date(expense.date), "MMM d, yyyy")} • {t("paid_by")} {expense.profiles?.name || "Unknown"}
                                       {expense.added_by_profile && expense.added_by_profile.name !== expense.profiles?.name && (
                                            <span className="block text-[10px] opacity-75">
                                                {t("added_by")} {expense.added_by_profile.name}
                                            </span>
                                       )}
                                   </p>
                               </div>
                           </div>
                           <div className="flex items-center gap-4">
                               <div className="font-bold text-red-500">
                                   -{Number(expense.amount).toFixed(2)}
                               </div>
                               <ActionMenu id={expense.id} type="expense" onDelete={handleDeleteExpense} />
                           </div>
                       </div>
                   ))
               )}
           </TabsContent>

           <TabsContent value="other_cost" className="space-y-4 mt-4">
               {expenses.filter(e => e.category !== 'meal').length === 0 ? (
                   <div className="text-center py-10 text-muted-foreground border border-dashed rounded-lg">{t("no_records")}</div>
               ) : (
                   expenses.filter(e => e.category !== 'meal').map((expense) => (
                       <div key={expense.id} className="flex items-center justify-between p-4 rounded-lg bg-card border glass hover:bg-muted/50 transition-colors">
                           <div className="flex items-center gap-4">
                               <div className="p-2 rounded-full bg-blue-500/10 text-blue-500">
                                   <TrendingDown className="h-4 w-4" />
                               </div>
                               <div>
                                   <p className="font-medium text-sm">{expense.details || expense.category}</p>
                                   <p className="text-xs text-muted-foreground">
                                       {format(new Date(expense.date), "MMM d, yyyy")} • {t("paid_by")} {expense.profiles?.name || "Unknown"}
                                       {expense.added_by_profile && expense.added_by_profile.name !== expense.profiles?.name && (
                                            <span className="block text-[10px] opacity-75">
                                                {t("added_by")} {expense.added_by_profile.name}
                                            </span>
                                       )}
                                   </p>
                               </div>
                           </div>
                           <div className="flex items-center gap-4">
                               <div className="font-bold text-red-500">
                                   -{Number(expense.amount).toFixed(2)}
                               </div>
                               <ActionMenu id={expense.id} type="expense" onDelete={handleDeleteExpense} />
                           </div>
                       </div>
                   ))
               )}
           </TabsContent>

           <TabsContent value="deposits" className="space-y-4 mt-4">
               {deposits.length === 0 ? (
                   <div className="text-center py-10 text-muted-foreground border border-dashed rounded-lg">{t("no_records")}</div>
               ) : (
                   deposits.map((deposit) => (
                       <div key={deposit.id} className="flex items-center justify-between p-4 rounded-lg bg-card border glass hover:bg-muted/50 transition-colors">
                           <div className="flex items-center gap-4">
                               <div className="p-2 rounded-full bg-green-500/10 text-green-500">
                                   <TrendingUp className="h-4 w-4" />
                               </div>
                               <div>
                                   <p className="font-medium text-sm">{deposit.details || "Deposit"}</p>
                                   <p className="text-xs text-muted-foreground">
                                       {format(new Date(deposit.date), "MMM d, yyyy")} • {t("paid_by")} {deposit.profiles?.name || "Unknown"}
                                       {deposit.added_by_profile && deposit.added_by_profile.name !== deposit.profiles?.name && (
                                            <span className="block text-[10px] opacity-75">
                                                {t("added_by")} {deposit.added_by_profile.name}
                                            </span>
                                       )}
                                   </p>
                               </div>
                           </div>
                           <div className="flex items-center gap-4">
                               <div className="font-bold text-green-500">
                                   +{Number(deposit.amount).toFixed(2)}
                               </div>
                               <ActionMenu id={deposit.id} type="deposit" onDelete={handleDeleteDeposit} />
                           </div>
                       </div>
                   ))
               )}
           </TabsContent>
       </Tabs>
    </div>
  )
}

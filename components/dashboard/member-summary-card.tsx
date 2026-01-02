"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Shield } from "lucide-react"

interface MemberSummaryCardProps {
  summary: {
    user_id: string
    name: string
    role: string
    avatar_url?: string
    totalMeals: number
    mealCost: number
    sharedCost: number
    individualCost: number
    totalCost: number
    totalDeposit: number
    balance: number
  }
}

export function MemberSummaryCard({ summary }: MemberSummaryCardProps) {
  const { name, role, avatar_url, totalMeals, mealCost, sharedCost, individualCost, totalCost, totalDeposit, balance } = summary
  const initials = name ? name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase() : "??"

  const isPositive = balance >= 0
  
  const Row = ({ label, value, isMoney = false, highlight = false, textClass = "" }: { label: string, value: string | number, isMoney?: boolean, highlight?: boolean, textClass?: string }) => (
      <div className={`flex items-center justify-between text-sm ${highlight ? "font-semibold" : ""}`}>
          <span className="text-muted-foreground">{label}</span>
          <span className={`font-mono text-right ${textClass}`}>
              {isMoney && "৳"}{typeof value === 'number' && isMoney ? value.toFixed(0) : value}
          </span>
      </div>
  )

  return (
    <Card className="glass-card flex flex-col h-full hover:-translate-y-1 transition-all duration-300 overflow-hidden shadow-sm hover:shadow-md">
      {/* Header */}
      <div className="p-4 flex items-center gap-3 border-b border-border/40 bg-secondary/10">
         <Avatar className="h-10 w-10 border border-primary/20 shadow-sm">
            <AvatarImage src={avatar_url} />
            <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">{initials}</AvatarFallback>
         </Avatar>
         <div className="flex-1 min-w-0">
             <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm truncate text-foreground/90">{name || "Unknown"}</h4>
                {role === "manager" && <Shield className="h-3 w-3 text-purple-500 shrink-0" />}
             </div>
             <div className="text-xs text-muted-foreground capitalize">{role}</div>
         </div>
      </div>

      {/* Body */}
      <CardContent className="p-4 space-y-3 flex-1 flex flex-col justify-center">
         <Row label="Total Meal" value={totalMeals} />
         <Row label="Meal Cost" value={mealCost} isMoney />
         <Row label="Shared Other Cost" value={sharedCost} isMoney />
         <Row label="Individual Other Cost" value={individualCost} isMoney />

         <div className="my-1 border-t border-dashed border-border/60" />

         <Row label="Total Cost" value={totalCost} isMoney highlight />
         <Row label="Deposit" value={totalDeposit} isMoney textClass="text-green-600 dark:text-green-400" />

         <div className="mt-2 pt-3 border-t border-border">
            <div className="flex justify-between items-center">
               <span className="font-semibold text-sm">Balance</span>
               <Badge
                    className={`font-mono text-sm px-2 py-0.5 shadow-sm border ${
                        isPositive 
                        ? "bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 hover:bg-green-500/20"
                        : "bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-500/20"
                    }`}
                    variant="outline"
                >
                   {isPositive ? "+" : "-"} ৳{Math.abs(balance).toFixed(0)}
                </Badge>
            </div>
         </div>
      </CardContent>
    </Card>
  )
}

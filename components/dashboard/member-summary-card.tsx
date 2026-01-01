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
  
  return (
    <Card className="glass-card overflow-hidden hover:bg-white/5 transition-all border-l-4 border-l-transparent hover:border-l-primary shadow-sm hover:shadow-md">
      <CardContent className="p-4 flex flex-col md:flex-row items-center gap-4 md:gap-8">
          
          {/* Left: Identity */}
          <div className="flex items-center gap-4 w-full md:w-auto min-w-[220px]">
            <Avatar className="h-14 w-14 border-2 border-primary/20 shadow-sm">
              <AvatarImage src={avatar_url} />
              <AvatarFallback className="bg-primary/5 text-primary font-bold">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
                <div className="flex items-center gap-2">
                    <h4 className="font-bold text-lg truncate text-foreground/90">{name || "Unknown"}</h4>
                    {role === "manager" && <Shield className="h-4 w-4 text-purple-500" fill="currentColor" fillOpacity={0.2} />}
                </div>
                <Badge variant={role === 'manager' ? "default" : "secondary"} className={`w-fit text-[10px] h-5 px-2 ${role === 'manager' ? 'bg-purple-500/10 text-purple-600 hover:bg-purple-500/20' : ''}`}>
                    {role}
                </Badge>
            </div>
          </div>

          {/* Right: Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-y-4 gap-x-8 w-full items-center text-center md:text-left border-l pl-0 md:pl-8 border-border/40">
             
             {/* Balance - Hero Stat */}
             <div className="flex flex-col gap-1 items-center md:items-start group">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Balance</span>
                <Badge 
                    className={`text-sm font-bold px-3 py-1 shadow-sm ${
                        isPositive 
                        ? "bg-green-500/15 text-green-700 hover:bg-green-500/25 border-green-200" 
                        : "bg-red-500/15 text-red-700 hover:bg-red-500/25 border-red-200"
                    }`}
                    variant="outline"
                >
                   {isPositive ? "+" : "-"} ৳{Math.abs(balance).toFixed(0)}
                </Badge>
             </div>
             
             <div className="flex flex-col gap-1">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Meals</span>
                <span className="font-mono text-lg font-medium text-foreground/80">{totalMeals}</span>
             </div>

             <div className="flex flex-col gap-1">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Deposit</span>
                <span className="font-mono text-lg font-medium text-green-600/90">৳{totalDeposit.toFixed(0)}</span>
             </div>

             <div className="flex flex-col gap-1">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Meal Cost</span>
                <span className="font-mono text-lg font-medium text-orange-600/90">৳{mealCost.toFixed(0)}</span>
             </div>

             <div className="flex flex-col gap-1">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Other Cost</span>
                <span className="font-mono text-lg font-medium text-blue-600/90">৳{(sharedCost + individualCost).toFixed(0)}</span>
             </div>
             
             <div className="flex flex-col gap-1">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Total Cost</span>
                <span className="font-mono text-lg font-bold text-foreground">৳{totalCost.toFixed(0)}</span>
             </div>
          </div>

      </CardContent>
    </Card>
  )
}

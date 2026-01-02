"use client"

import { StatsCard } from "@/components/dashboard/stats-card"
import { DollarSign, Utensils, PiggyBank, Scale, Users, Calendar } from "lucide-react"
import { MemberSummaryCard } from "@/components/dashboard/member-summary-card"

interface StatsProps {
  data: {
    monthName: string
    totalMembers: number
    totalMeals: number
    mealRate: number
    totalDeposit: number
    totalCost: number
    messBalance: number
    breakdown?: {
       mealCost: number
       sharedCost: number
       individualCost: number
    }
    myStats: {
      meals: number
      deposit: number
      cost: number
      balance: number
    }
    memberSummaries?: any[]
  }
}

export function DashboardStats({ data }: StatsProps) {
  return (
    <div className="space-y-8">
      {/* Quick Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* ... existing cards ... */}
        <StatsCard
          title="Mess Balance"
          value={`৳${data.messBalance.toFixed(0)}`}
          subValue="Current Reserve"
          icon={PiggyBank}
          variant="gradient"
          delay={1}
        />
        <StatsCard
          title="Total Meals"
          value={data.totalMeals}
          subValue="Mess Total"
          icon={Utensils}
          delay={2}
          className="border-primary/20 bg-primary/5"
        />
        <StatsCard
          title="Meal Rate"
          value={`৳${data.mealRate.toFixed(2)}`}
          subValue="Per meal cost"
          icon={Scale}
          delay={3}
        />
      </div>

       {/* Breakdown Stats */}
       <div className="grid gap-4 md:grid-cols-3">
          {/* ... existing breakdown cards ... */}
          <StatsCard
            title="Total Deposit"
            value={`৳${data.totalDeposit.toFixed(0)}`}
            subValue="All members"
            icon={DollarSign}
            delay={5}
            className="border-green-500/20 bg-green-500/5"
          />
           <StatsCard
            title="Total Meal Cost"
            value={`৳${(data.breakdown?.mealCost || 0).toFixed(0)}`}
            subValue="All members"
            icon={Utensils}
            delay={6}
            className="border-orange-500/20 bg-orange-500/5"
          />
           <StatsCard
            title="Other Costs"
            value={`৳${((data.breakdown?.sharedCost || 0) + (data.breakdown?.individualCost || 0)).toFixed(0)}`}
            subValue="Shared + Individual"
            icon={DollarSign}
            delay={7}
            className="border-blue-500/20 bg-blue-500/5"
          />
       </div>

      {/* Personal Stats Section */}
      <div>
        <h2 className="text-xl font-bold tracking-tight mb-4 flex items-center gap-2">
           <span className="h-6 w-1 bg-primary rounded-full" />
           My Performance
        </h2>
        <div className="grid gap-4 md:grid-cols-4">
             {/* ... existing personal cards ... */}
            <StatsCard
                title="My Balance"
                value={`৳${data.myStats.balance.toFixed(0)}`}
                subValue="Est. Remaining"
                icon={PiggyBank}
                variant="primary"
                delay={8}
            />
            <StatsCard
                title="My Deposit"
                value={`৳${data.myStats.deposit.toFixed(0)}`}
                subValue="Total Deposited"
                icon={DollarSign}
                delay={9}
            />
             <StatsCard
                title="My Meals"
                value={data.myStats.meals}
                subValue="Total Consumed"
                icon={Utensils}
                delay={10}
            />
            <StatsCard
                title="My Meal Cost"
                value={`৳${data.myStats.cost.toFixed(0)}`}
                subValue="Est. Cost"
                icon={Utensils}
                delay={11}
            />
        </div>
      </div>

      {/* All Member Summary Section */}
      {data.memberSummaries && data.memberSummaries.length > 0 && (
          <div>
            <h2 className="text-xl font-bold tracking-tight mb-4 flex items-center gap-2">
               <span className="h-6 w-1 bg-purple-500 rounded-full" />
               All Member Summary ({data.memberSummaries.length})
            </h2>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {data.memberSummaries.map((summary: any, i: number) => (
                    <MemberSummaryCard key={i} summary={summary} />
                ))}
            </div>
          </div>
      )}
    </div>
  )
}

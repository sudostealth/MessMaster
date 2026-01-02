"use server"

import { createClient } from "@/lib/supabase/server"

export async function getDashboardStats() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  // 1. Get Mess ID and Month
  const { data: member } = await supabase
    .from("mess_members")
    .select("mess_id")
    .eq("user_id", user.id)
    .single()

  if (!member) return { error: "No mess found" }

  const { data: activeMonth } = await supabase
    .from("months")
    .select("id, name, mess_id")
    .eq("mess_id", member.mess_id)
    .eq("is_active", true)
    .single()

  if (!activeMonth) return { data: null, message: "No active month" }

  // 2. Fetch Aggregates
  const [
    { data: meals },
    { data: expenses },
    { data: deposits },
    { data: members },
    { data: allocations }
  ] = await Promise.all([
    supabase.from("meals").select("breakfast, lunch, dinner, user_id, date").eq("month_id", activeMonth.id),
    supabase.from("expenses").select("id, amount, category, shopper_id, date").eq("month_id", activeMonth.id),
    supabase.from("deposits").select("amount, user_id, date").eq("month_id", activeMonth.id),
    supabase.from("mess_members").select("user_id, role, profiles(name, avatar_url)").eq("mess_id", activeMonth.mess_id).eq("status", "active"),
    supabase.from("expense_allocations")
      .select("amount, user_id, expense:expenses!inner(category)")
      .eq("expense.month_id", activeMonth.id) 
  ])

  // 3. Calculate Totals
  let totalMeals = 0
  meals?.forEach((m: any) => {
    totalMeals += (m.breakfast || 0) + (m.lunch || 0) + (m.dinner || 0)
  })

  const totalMealCost = expenses?.filter((e: any) => e.category === 'meal').reduce((sum: number, c: any) => sum + (c.amount || 0), 0) || 0
  const mealRate = totalMeals > 0 ? totalMealCost / totalMeals : 0

  const totalDeposit = deposits?.reduce((sum: number, d: any) => sum + (d.amount || 0), 0) || 0
  const totalSharedCost = expenses?.filter((e: any) => e.category === 'shared').reduce((sum: number, c: any) => sum + (c.amount || 0), 0) || 0
  const totalIndividualCost = expenses?.filter((e: any) => e.category === 'individual').reduce((sum: number, c: any) => sum + (c.amount || 0), 0) || 0
  
  const messBalance = totalDeposit - (totalMealCost + totalSharedCost + totalIndividualCost)

  // 4. Calculate Daily Stats
  // We need to group by date. Use a Map to aggregate.
  const dailyMap = new Map<string, { date: string, meals: number, expense: number, deposit: number }>()

  // Process Meals
  meals?.forEach((m: any) => {
    const d = m.date
    if (!dailyMap.has(d)) dailyMap.set(d, { date: d, meals: 0, expense: 0, deposit: 0 })
    const entry = dailyMap.get(d)!
    entry.meals += (m.breakfast || 0) + (m.lunch || 0) + (m.dinner || 0)
  })

  // Process Expenses
  expenses?.forEach((e: any) => {
    const d = e.date
    if (!dailyMap.has(d)) dailyMap.set(d, { date: d, meals: 0, expense: 0, deposit: 0 })
    const entry = dailyMap.get(d)!
    entry.expense += (e.amount || 0)
  })

  // Process Deposits
  deposits?.forEach((dp: any) => {
    const d = dp.date
    if (!dailyMap.has(d)) dailyMap.set(d, { date: d, meals: 0, expense: 0, deposit: 0 })
    const entry = dailyMap.get(d)!
    entry.deposit += (dp.amount || 0)
  })

  // Convert Map to Array and Sort by Date
  const dailyStats = Array.from(dailyMap.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())


  // 5. Calculate Member Summaries
  const memberSummaries = members?.map((m: any) => {
      // Handle profiles array/object quirk (Supabase returns array for 1:1 if not !inner or forced single)
      const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles

      const userMeals = meals?.filter((meal: any) => meal.user_id === m.user_id) || []
      const userDeposits = deposits?.filter((d: any) => d.user_id === m.user_id) || []
      
      // Calculate Meals
      let myMealCount = 0
      userMeals.forEach((um: any) => myMealCount += (um.breakfast||0) + (um.lunch||0) + (um.dinner||0))
      const myMealCost = myMealCount * mealRate

      // Calculate Shared & Individual from Allocations
      const myAllocations = allocations?.filter((a: any) => a.user_id === m.user_id) || []
      
      const mySharedCost = myAllocations
        .filter((a: any) => a.expense?.category === 'shared')
        .reduce((sum: number, a: any) => sum + (a.amount || 0), 0)

      const myIndividualCost = myAllocations
        .filter((a: any) => a.expense?.category === 'individual')
        .reduce((sum: number, a: any) => sum + (a.amount || 0), 0)

      const myTotalDeposit = userDeposits.reduce((sum: number, d: any) => sum + (d.amount || 0), 0)
      const myTotalCost = myMealCost + mySharedCost + myIndividualCost
      const myBalance = myTotalDeposit - myTotalCost
      
      return {
          user_id: m.user_id,
          name: profile?.name || "Unknown",
          role: m.role,
          avatar_url: profile?.avatar_url,
          totalMeals: myMealCount,
          mealCost: myMealCost,
          sharedCost: mySharedCost,
          individualCost: myIndividualCost,
          totalCost: myTotalCost,
          totalDeposit: myTotalDeposit,
          balance: myBalance
      }
  })

  // Re-calculate myStats
  const mySummary = memberSummaries?.find((s: any) => s.user_id === user.id)

  return {
    data: {
      monthName: activeMonth.name,
      totalMembers: members?.length || 0,
      totalMeals,
      mealRate,
      totalDeposit,
      totalCost: totalMealCost + totalSharedCost + totalIndividualCost,
      breakdown: {
         mealCost: totalMealCost,
         sharedCost: totalSharedCost,
         individualCost: totalIndividualCost
      },
      messBalance,
      myStats: {
        meals: mySummary?.totalMeals || 0,
        deposit: mySummary?.totalDeposit || 0,
        cost: mySummary?.totalCost || 0,
        balance: mySummary?.balance || 0
      },
      memberSummaries,
      dailyStats // Return the daily statistics
    }
  }
}

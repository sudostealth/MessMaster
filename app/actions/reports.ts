"use server"

import { createClient } from "@/lib/supabase/server"

export async function getDetailedMonthReport() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  // 1. Get Mess ID and Month
  const { data: member } = await supabase
    .from("mess_members")
    .select("mess_id, role, can_manage_finance")
    .eq("user_id", user.id)
    .single()

  if (!member) return { error: "No mess found" }

  // Check permissions - only managers or finance managers can download full reports
  if (member.role !== 'manager' && !member.can_manage_finance) {
      return { error: "Unauthorized: Only managers can download detailed reports" }
  }

  const { data: activeMonth } = await supabase
    .from("months")
    .select("id, name, mess_id, messes(name, created_at)")
    .eq("mess_id", member.mess_id)
    .eq("is_active", true)
    .single()

  if (!activeMonth) return { error: "No active month found" }

  // 2. Fetch All Data
  const [
    { data: meals },
    { data: expenses },
    { data: deposits },
    { data: members },
    { data: allocations }
  ] = await Promise.all([
    supabase.from("meals")
        .select("breakfast, lunch, dinner, user_id, date, mess_members(profiles(name))")
        .eq("month_id", activeMonth.id)
        .order("date", { ascending: false }),
    supabase.from("expenses").select("amount, category").eq("month_id", activeMonth.id),
    supabase.from("deposits").select("amount, user_id").eq("month_id", activeMonth.id),
    supabase.from("mess_members").select("user_id, profiles(name)").eq("mess_id", activeMonth.mess_id).eq("status", "active"),
    supabase.from("expense_allocations")
      .select("amount, user_id, expense:expenses!inner(category)")
      .eq("expense.month_id", activeMonth.id)
  ])

  // 3. Calculate Totals (Same logic as stats.ts)
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

  // 4. Calculate Member Summaries
  const memberSummaries = members?.map((m: any) => {
      const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles
      const userName = profile?.name || "Unknown"

      const userMeals = meals?.filter((meal: any) => meal.user_id === m.user_id) || []
      const userDeposits = deposits?.filter((d: any) => d.user_id === m.user_id) || []

      let myMealCount = 0
      userMeals.forEach((um: any) => myMealCount += (um.breakfast||0) + (um.lunch||0) + (um.dinner||0))
      const myMealCost = myMealCount * mealRate

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
          name: userName,
          totalMeals: myMealCount,
          totalDeposit: myTotalDeposit,
          mealCost: myMealCost,
          sharedCost: mySharedCost,
          individualCost: myIndividualCost,
          totalCost: myTotalCost, // Meal + Shared + Individual
          balance: myBalance
      }
  })

  // 5. Prepare Detailed Meal Logs
  // Flatten and format for the table
  const mealLogs = meals?.map((m: any) => {
       const profile = Array.isArray(m.mess_members?.profiles)
            ? m.mess_members?.profiles[0]
            : m.mess_members?.profiles

       return {
           date: m.date,
           memberName: profile?.name || "Unknown",
           breakfast: m.breakfast || 0,
           lunch: m.lunch || 0,
           dinner: m.dinner || 0
       }
  })

  // @ts-expect-error
  const messName = Array.isArray(activeMonth.messes) ? activeMonth.messes[0]?.name : activeMonth.messes?.name

  return {
      messName: messName || "Mess",
      monthName: activeMonth.name,
      messDetails: {
          balance: messBalance,
          totalMeal: totalMeals,
          totalDeposit,
          totalMealCost,
          mealRate,
          totalSharedCost,
          totalIndividualCost,
          totalCost: totalMealCost + totalSharedCost + totalIndividualCost
      },
      memberSummaries,
      mealLogs
  }
}

"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { broadcastNotification } from "./notifications"

export async function addMeal(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const date = formData.get("date") as string
  const memberId = formData.get("memberId") as string
  const breakfast = parseFloat(formData.get("breakfast") as string || "0")
  const lunch = parseFloat(formData.get("lunch") as string || "0")
  const dinner = parseFloat(formData.get("dinner") as string || "0")

  // Validation
  if (breakfast < 0 || lunch < 0 || dinner < 0) {
      return { error: "Values cannot be negative" }
  }

  // Get active month and requester role
  const { data: requester } = await supabase
    .from("mess_members")
    .select("mess_id, role, can_manage_meals")
    .eq("user_id", user.id)
    .eq("status", "active")
    .single()

  if (!requester) return { error: "No active mess membership found" }

  // Permission Check
  // If target memberId is NOT the requester, requester MUST be manager or have permission
  if (memberId !== user.id) {
      if (requester.role !== 'manager' && !requester.can_manage_meals) {
          return { error: "Unauthorized: You can only manage your own meals" }
      }
  }

  const { data: activeMonth } = await supabase
    .from("months")
    .select("id")
    .eq("mess_id", requester.mess_id)
    .eq("is_active", true)
    .single()

  if (!activeMonth) return { error: "No active month started" }

  // Check if meal entry exists for this user + date + month
  const { data: existingMeal } = await supabase
    .from("meals")
    .select("id")
    .eq("month_id", activeMonth.id)
    .eq("user_id", memberId)
    .eq("date", date)
    .maybeSingle() // Use maybeSingle to avoid error if 0 rows

  if (existingMeal) {
      // Update
      const { error } = await supabase
        .from("meals")
        .update({ breakfast, lunch, dinner })
        .eq("id", existingMeal.id)
      
      if (error) return { error: error.message }
  } else {
      // Insert
      const { error } = await supabase
        .from("meals")
        .insert({
            month_id: activeMonth.id,
            user_id: memberId,
            date,
            breakfast,
            lunch,
            dinner
        })
      
      if (error) return { error: error.message }
  }

  revalidatePath("/dashboard/meals")
  return { success: true }
}

export async function addBulkMeals(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const date = formData.get("date") as string
  if (!date) return { error: "Date is required" }

  // Get active month and check permissions
  const { data: member } = await supabase.from("mess_members").select("mess_id, role, can_manage_meals").eq("user_id", user.id).single()
  
  if (!member) return { error: "No mess found" }
  if (member.role !== 'manager' && !member.can_manage_meals) return { error: "Unauthorized" }

  const { data: activeMonth } = await supabase.from("months").select("id").eq("mess_id", member.mess_id).eq("is_active", true).single()
  if (!activeMonth) return { error: "No active month" }

  // Extract meals from formData
  // Expected format: meal_{userId}_{type} -> value
  // We need to iterate over all active members
  
  const { data: members } = await supabase.from("mess_members").select("user_id").eq("mess_id", member.mess_id).eq("status", "active")
  
  if (members) {
      for (const m of members) {
          const breakfast = parseFloat(formData.get(`meal_${m.user_id}_breakfast`) as string || "0")
          const lunch = parseFloat(formData.get(`meal_${m.user_id}_lunch`) as string || "0")
          const dinner = parseFloat(formData.get(`meal_${m.user_id}_dinner`) as string || "0")
          
          if (breakfast > 0 || lunch > 0 || dinner > 0) {
              // Check existing
              const { data: existing } = await supabase.from("meals").select("id").eq("month_id", activeMonth.id).eq("user_id", m.user_id).eq("date", date).maybeSingle()
              
              if (existing) {
                  await supabase.from("meals").update({ breakfast, lunch, dinner }).eq("id", existing.id)
              } else {
                  await supabase.from("meals").insert({
                      month_id: activeMonth.id,
                      user_id: m.user_id,
                      date,
                      breakfast,
                      lunch,
                      dinner
                  })
              }
          }
      }
  }

  revalidatePath("/dashboard/meals")
  return { success: true }
}

export async function getMessMembers() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: member } = await supabase
      .from("mess_members")
      .select("mess_id")
      .eq("user_id", user.id)
      .single()

    if (!member) return []

    // We use !inner join on profiles to ensure we only get valid users
    const { data: members, error } = await supabase
      .from("mess_members")
      .select("user_id, role, profiles!inner(name, email)")
      .eq("mess_id", member.mess_id)
      .eq("status", "active")
    
    if (error) {
        console.error("Error fetching members:", error)
        return []
    }

    return members || []
}

export async function deleteMeal(mealId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Not authenticated" }

    // Check permissions (must be manager)
    const { data: member } = await supabase.from("mess_members").select("role, mess_id, can_manage_meals").eq("user_id", user.id).single()
    if (!member || (member.role !== 'manager' && !member.can_manage_meals)) return { error: "Unauthorized" }

    const { error } = await supabase.from("meals").delete().eq("id", mealId)
    
    if (error) return { error: error.message }
    
    revalidatePath("/dashboard/meals")
    return { success: true }
}

export async function bulkUpsertMeals(date: string, values: { breakfast: number, lunch: number, dinner: number }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const { data: manager } = await supabase.from("mess_members").select("mess_id, role, can_manage_meals").eq("user_id", user.id).single()
  
  if (!manager) return { error: "No mess found" }
  if (manager.role !== 'manager' && !manager.can_manage_meals) return { error: "Unauthorized: Permission denied" }

  // Get active members
  const { data: members } = await supabase.from("mess_members").select("user_id").eq("mess_id", manager.mess_id).eq("status", "active")
  if (!members || members.length === 0) return { error: "No active members found" }

  const { data: activeMonth } = await supabase.from("months").select("id").eq("mess_id", manager.mess_id).eq("is_active", true).single()
  if (!activeMonth) return { error: "No active month" }

  // Prepare upsert data
  const upsertData = members.map(m => ({
      month_id: activeMonth.id,
      user_id: m.user_id,
      date: date,
      breakfast: values.breakfast,
      lunch: values.lunch,
      dinner: values.dinner
  }))

  const { error } = await supabase.from("meals").upsert(upsertData, { onConflict: 'user_id, date, month_id' })

  if (error) return { error: error.message }
  
  revalidatePath("/dashboard/meals")
  return { success: true }
}

export async function batchUpsertMeals(date: string, meals: { user_id: string, breakfast: number, lunch: number, dinner: number }[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const { data: manager } = await supabase.from("mess_members").select("mess_id, role, can_manage_meals").eq("user_id", user.id).single()
  if (manager?.role !== 'manager' && !manager?.can_manage_meals) return { error: "Unauthorized" }

  const { data: activeMonth } = await supabase.from("months").select("id").eq("mess_id", manager.mess_id).eq("is_active", true).single()
  if (!activeMonth) return { error: "No active month" }

  const upsertData = meals.map(m => ({
      month_id: activeMonth.id,
      user_id: m.user_id,
      date: date,
      breakfast: m.breakfast,
      lunch: m.lunch,
      dinner: m.dinner
  }))

  const { error } = await supabase.from("meals").upsert(upsertData, { onConflict: 'user_id, date, month_id' })

  if (error) return { error: error.message }
  
  revalidatePath("/dashboard/meals")
  return { success: true }
}

export async function getMealsByDate(date: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: member } = await supabase.from("mess_members").select("mess_id").eq("user_id", user.id).single()
  if (!member) return []
  
  const { data: activeMonth } = await supabase.from("months").select("id").eq("mess_id", member.mess_id).eq("is_active", true).single()
  if(!activeMonth) return []

  const { data } = await supabase.from("meals")
    .select("*")
    .eq("date", date)
    .eq("month_id", activeMonth.id)
  
  return data || []
}

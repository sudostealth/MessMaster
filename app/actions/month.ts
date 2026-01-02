"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function startNewMonth(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const name = formData.get("name") as string
  const startDate = formData.get("startDate") as string

  // Get Mess ID
  const { data: member } = await supabase
    .from("mess_members")
    .select("mess_id")
    .eq("user_id", user.id)
    .eq("role", "manager")
    .single()

  if (!member) return { error: "You are not a manager of any mess" }

  // Check if active month exists
  const { data: activeMonth } = await supabase
    .from("months")
    .select("id")
    .eq("mess_id", member.mess_id)
    .eq("is_active", true)
    .single()
  
  if (activeMonth) {
      // Option: Auto-close previous month or Error. For now, let's close it safely.
      await supabase.from("months").update({ is_active: false }).eq("id", activeMonth.id)
  }

  const { error } = await supabase
    .from("months")
    .insert({
      mess_id: member.mess_id,
      name,
      start_date: startDate,
      is_active: true
    })

  if (error) return { error: error.message }

  revalidatePath("/dashboard")
  return { success: true }
}

export async function endMonth(monthId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  // Verify Manager
  const { data: month } = await supabase.from("months").select("mess_id").eq("id", monthId).single()
  if (!month) return { error: "Month not found" }

  const { data: member } = await supabase
    .from("mess_members")
    .select("role")
    .eq("mess_id", month.mess_id)
    .eq("user_id", user.id)
    .single()

  if (member?.role !== 'manager') return { error: "Unauthorized" }

  const { error } = await supabase
    .from("months")
    .update({ is_active: false })
    .eq("id", monthId)

  if (error) return { error: error.message }
  revalidatePath("/dashboard")
  return { success: true }
}

export async function deleteMonth(monthId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

    // Verify Manager
  const { data: month } = await supabase.from("months").select("mess_id").eq("id", monthId).single()
  if (!month) return { error: "Month not found" }

  const { data: member } = await supabase
    .from("mess_members")
    .select("role")
    .eq("mess_id", month.mess_id)
    .eq("user_id", user.id)
    .single()

  if (member?.role !== 'manager') return { error: "Unauthorized" }

  // Deleting month should cascade delete related data (meals, expenses) if DB configured with cascade.
  // Assuming it is or we accept potential orphans if not cascaded.
  // Manual Cascade Delete: Remove related data first
  
  // 1. Delete Meals
  const { error: mealsError } = await supabase.from("meals").delete().eq("month_id", monthId)
  if (mealsError) return { error: "Failed to delete meals: " + mealsError.message }

  // 2. Delete Deposits
  const { error: depositsError } = await supabase.from("deposits").delete().eq("month_id", monthId)
  if (depositsError) return { error: "Failed to delete deposits: " + depositsError.message }

  // 4. Delete Expenses (allocations will cascade if set up, otherwise we might need to delete them too)
  // Checking schema, expense_allocations has ON DELETE CASCADE on expense_id, so this is safe.
  const { error: expensesError } = await supabase.from("expenses").delete().eq("month_id", monthId)
  if (expensesError) return { error: "Failed to delete expenses: " + expensesError.message }

  // 5. Delete Notifications related to this month (if any specific ones exist)
  await supabase.from("notifications").delete().eq("month_id", monthId)

  // 6. Finally Delete Month
  const { error } = await supabase
    .from("months")
    .delete()
    .eq("id", monthId)

  if (error) return { error: error.message }
  revalidatePath("/dashboard")
  return { success: true }
}

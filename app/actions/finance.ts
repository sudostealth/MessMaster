"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { broadcastNotification } from "./notifications"

// DEPOSITS
export async function addDeposit(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const amount = parseFloat(formData.get("amount") as string)
  const date = formData.get("date") as string
  const memberId = formData.get("memberId") as string
  const details = formData.get("details") as string

  // Logic to find active month and permissions
  const { data: member } = await supabase
      .from("mess_members")
      .select("mess_id, role, can_manage_finance")
      .eq("user_id", user.id)
      .single()

  if (!member) return { error: "No mess found" }
  
  if (member.role !== 'manager' && !member.can_manage_finance) {
      return { error: "Unauthorized: You do not have permission to manage finance." }
  }

  const { data: activeMonth } = await supabase.from("months").select("id").eq("mess_id", member.mess_id).eq("is_active", true).single()
  if (!activeMonth) return { error: "No active month" }

  const { error } = await supabase
    .from("deposits")
    .insert({
      month_id: activeMonth.id,
      user_id: memberId,
      added_by: user.id,
      amount,
      date,
      details
    })

  if (error) return { error: error.message }
  
  // Notify
  const { data: depositor } = await supabase.from("profiles").select("name").eq("id", memberId).single()
  const depositorName = depositor?.name || "Member"
  
  await broadcastNotification(
      member.mess_id, 
      "New Deposit", 
      `Deposit of ৳${amount} recorded for ${depositorName}.`,
      undefined,
      activeMonth.id
  )
  
  revalidatePath("/dashboard/finance")
  return { success: true }
}

// EXPENSES (Cost)
export async function addCost(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const amount = parseFloat(formData.get("amount") as string)
  const date = formData.get("date") as string
  const details = formData.get("details") as string
  const category = formData.get("category") as "meal" | "shared" | "individual"
  
  // Logic to find active month and permissions
  const { data: member } = await supabase
      .from("mess_members")
      .select("mess_id, role, can_manage_finance")
      .eq("user_id", user.id)
      .single()

  if (!member) return { error: "No mess found" }

  if (member.role !== 'manager' && !member.can_manage_finance) {
      return { error: "Unauthorized: You do not have permission to manage finance." }
  }

  const { data: activeMonth } = await supabase.from("months").select("id").eq("mess_id", member.mess_id).eq("is_active", true).single()
  if (!activeMonth) return { error: "No active month" }

  // Check Balance
  const { data: deposits } = await supabase.from("deposits").select("amount").eq("month_id", activeMonth.id)
  const { data: expenses } = await supabase.from("expenses").select("amount").eq("month_id", activeMonth.id)

  const totalDeposits = deposits?.reduce((sum, d) => sum + Number(d.amount), 0) || 0
  const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0

  // Rule: Cost <= Mess Balance
  if ((totalDeposits - totalExpenses) < amount) {
    return { error: `Insufficient Mess Balance. Current Balance: ৳${(totalDeposits - totalExpenses).toFixed(2)}` }
  }

  // Fetch Shopper/Responsible Member Names for "involved_members" column
  let involvedMembersText = ""
  
  if (category === 'meal') {
      const shopperIds = formData.getAll("shopperIds") as string[]
      if (shopperIds.length === 0) return { error: "Shoppers are required" }

      const { data: shoppers } = await supabase.from("profiles").select("name").in("id", shopperIds)
      involvedMembersText = shoppers?.map(s => s.name).join(", ") || ""
  }
  else if (category === 'shared') {
      // Logic for Shared: No "Paid By". Logic: Amount reduced from Mess Balance. Allocated to selected members.
      const allocatedMemberIds = formData.getAll("allocatedMemberIds") as string[]
      if (allocatedMemberIds.length === 0) return { error: "Please select members to share the cost" }

      const { data: members } = await supabase.from("profiles").select("name").in("id", allocatedMemberIds)
      involvedMembersText = members?.map(m => m.name).join(", ") || ""
  }
  else if (category === 'individual') {
      // Logic for Individual: No "Paid By". Allocated to ONE member.
      const targetMemberId = formData.get("memberId") as string
      if (!targetMemberId) return { error: "Target Member is required" }

      const { data: member } = await supabase.from("profiles").select("name").eq("id", targetMemberId).single()
      involvedMembersText = member?.name || ""
  }

  // Insert ONE Expense Record
  const { data: expense, error } = await supabase
    .from("expenses")
    .insert({
      month_id: activeMonth.id,
      added_by: user.id,
      amount: amount,
      date,
      category,
      details,
      involved_members: involvedMembersText,
      shopper_id: null // Explicitly null as we use involved_members text now
    })
    .select()
    .single()

  if (error) return { error: error.message }

  // Handle Allocations
  if (category === 'shared') {
      const allocatedMemberIds = formData.getAll("allocatedMemberIds") as string[]
      const splitAmount = amount / allocatedMemberIds.length
      
      const allocations = allocatedMemberIds.map(uid => ({
          expense_id: expense.id,
          user_id: uid,
          amount: splitAmount
      }))
      await supabase.from("expense_allocations").insert(allocations)
  }
  else if (category === 'individual') {
      const targetMemberId = formData.get("memberId") as string
      await supabase.from("expense_allocations").insert({
          expense_id: expense.id,
          user_id: targetMemberId,
          amount: amount
      })
  }

  await broadcastNotification(member.mess_id, "New Expense", `Expense of ৳${amount} for ${category} added.`, undefined, activeMonth.id)

  revalidatePath("/dashboard/finance")
  return { success: true }
}

// DELETE ACTIONS
export async function deleteDeposit(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const { error } = await supabase.from("deposits").delete().eq("id", id)

  if (error) return { error: error.message }
  revalidatePath("/dashboard/finance")
  return { success: true }
}

export async function deleteExpense(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const { error } = await supabase.from("expenses").delete().eq("id", id)

  if (error) return { error: error.message }
  revalidatePath("/dashboard/finance")
  return { success: true }
}

// UPDATE ACTIONS
export async function updateDeposit(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const id = formData.get("id") as string
  const amount = parseFloat(formData.get("amount") as string)
  const date = formData.get("date") as string
  const details = formData.get("details") as string

  const { error } = await supabase
    .from("deposits")
    .update({ amount, date, details })
    .eq("id", id)

  if (error) return { error: error.message }
  
  revalidatePath("/dashboard/finance")
  return { success: true }
}

export async function updateExpense(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const id = formData.get("id") as string
  const amount = parseFloat(formData.get("amount") as string)
  const date = formData.get("date") as string
  const details = formData.get("details") as string
  // Note: changing shopper or category isn't supported in simple edit to avoid complex reallocation logic for now
  
  const { error } = await supabase
    .from("expenses")
    .update({ amount, date, details })
    .eq("id", id)

  if (error) return { error: error.message }
  
  revalidatePath("/dashboard/finance")
  return { success: true }
}

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
      `Deposit of ৳${amount} recorded for ${depositorName}.`
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

  // Shopper ID is required for all
  const shopperIds = formData.getAll("shopperIds") as string[]
  const singleShopperId = formData.get("shopperId") as string // fallback for shared/individual tabs that might still use single select

  // If "meal" category, we might have multiple shoppers
  const finalShopperIds = shopperIds.length > 0 ? shopperIds : (singleShopperId ? [singleShopperId] : [])
  
  if (finalShopperIds.length === 0) return { error: "Paid By (Shopper) is required" }

  const amountPerShopper = amount / finalShopperIds.length

  for (const sId of finalShopperIds) {
      const { data: expense, error } = await supabase
        .from("expenses")
        .insert({
          month_id: activeMonth.id,
          added_by: user.id,
          amount: amountPerShopper, // Split amount
          date,
          category,
          details: finalShopperIds.length > 1 ? `${details} (Split with ${finalShopperIds.length} shoppers)` : details,
          shopper_id: sId
        })
        .select()
        .single()

      if (error) return { error: error.message }

      // Handle Allocations (Only doing this once per split expense is technically redundant but valid logic-wise as allocation links to expense_id)
      // Actually, if we have shared cost split, we want the *total* shared amount allocated.
      // But if we split the expense record itself, each expense record warrants its own allocation logic?
      // Wait, if 2 people buy a 1000 shared item (500 each), the total cost is 1000. 
      // Expense 1: 500 (Shopper A). Allocations linked to Expense 1?
      // Expense 2: 500 (Shopper B). Allocations linked to Expense 2?
      // Yes, this works. The sum of allocations = sum of expenses = total cost.
      
      if (category === 'shared') {
          const allocatedMemberIds = formData.getAll("allocatedMemberIds") as string[]
          if (allocatedMemberIds.length > 0) {
             const splitAmount = amountPerShopper / allocatedMemberIds.length
             const allocations = allocatedMemberIds.map(uid => ({
                  expense_id: expense.id,
                  user_id: uid,
                  amount: splitAmount
             }))
             await supabase.from("expense_allocations").insert(allocations)
          } else {
             // Fallback or Error? If no members selected for shared cost, it's orphan cost.
             // But UI has defaultChecked.
          }
      } else if (category === 'individual') {
          const memberId = formData.get("memberId") as string
          if (memberId) {
              await supabase.from("expense_allocations").insert({
                  expense_id: expense.id,
                  user_id: memberId,
                  amount: amountPerShopper
              })
          }
      }
  }

  await broadcastNotification(member.mess_id, "New Expense", `Expense of ৳${amount} for ${category} added.`)

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

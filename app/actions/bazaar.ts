"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { addDays, format, startOfDay } from "date-fns"

/**
 * Get all bazaar schedules for a specific month
 */
export async function getBazaarSchedules(monthId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("bazaar_schedules")
    .select(`
      *,
      shoppers:bazaar_shoppers(
        *,
        profile:profiles(name, email, avatar_url)
      )
    `)
    .eq("month_id", monthId)
    .order("date", { ascending: true })

  if (error) {
    console.error("Error fetching bazaar schedules:", error)
    return { error: "Failed to fetch schedules" }
  }

  return { data }
}

/**
 * Create a manual bazaar schedule
 */
export async function createManualSchedule(
  monthId: string,
  date: Date,
  memberIds: string[],
  shoppingList?: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: "Unauthorized" }

  // Get mess_id from month
  const { data: month } = await supabase
    .from("months")
    .select("mess_id")
    .eq("id", monthId)
    .single()

  if (!month) return { error: "Month not found" }

  // Check permissions
  const { data: membership } = await supabase
    .from("mess_members")
    .select("role, can_manage_meals")
    .eq("mess_id", month.mess_id)
    .eq("user_id", user.id)
    .single()

  if (!membership || (membership.role !== 'manager' && !membership.can_manage_meals)) {
    return { error: "Permission denied" }
  }

  // Create schedule
  const { data: schedule, error: scheduleError } = await supabase
    .from("bazaar_schedules")
    .insert({
      month_id: monthId,
      mess_id: month.mess_id,
      date: format(date, "yyyy-MM-dd"),
      shopping_list: shoppingList,
      created_by: user.id
    })
    .select()
    .single()

  if (scheduleError) {
    console.error("Error creating schedule:", scheduleError)
    return { error: "Failed to create schedule" }
  }

  // Add shoppers
  if (memberIds.length > 0) {
    const shoppersData = memberIds.map(userId => ({
      schedule_id: schedule.id,
      user_id: userId
    }))

    const { error: shoppersError } = await supabase
      .from("bazaar_shoppers")
      .insert(shoppersData)

    if (shoppersError) {
      console.error("Error adding shoppers:", shoppersError)
      // Cleanup schedule if shoppers failed? Or just return error?
      // For now, return error but schedule exists.
      return { error: "Schedule created but failed to add members" }
    }
  }

  revalidatePath("/dashboard")
  return { success: true }
}

/**
 * Generate automatic bazaar schedules
 */
export async function generateAutoSchedule(
  monthId: string,
  startDate: Date,
  frequency: number, // in days
  totalTrips: number,
  membersPerTrip: number
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: "Unauthorized" }

  // Get mess_id
  const { data: month } = await supabase
    .from("months")
    .select("mess_id")
    .eq("id", monthId)
    .single()

  if (!month) return { error: "Month not found" }

  // Check permissions
  const { data: membership } = await supabase
    .from("mess_members")
    .select("role, can_manage_meals")
    .eq("mess_id", month.mess_id)
    .eq("user_id", user.id)
    .single()

  if (!membership || (membership.role !== 'manager' && !membership.can_manage_meals)) {
    return { error: "Permission denied" }
  }

  // 1. Delete future schedules (from startDate onwards) for this month
  const startStr = format(startDate, "yyyy-MM-dd")
  const { error: deleteError } = await supabase
    .from("bazaar_schedules")
    .delete()
    .eq("month_id", monthId)
    .gte("date", startStr)

  if (deleteError) {
    console.error("Error clearing old schedules:", deleteError)
    return { error: "Failed to clear existing schedules" }
  }

  // 2. Get all active members
  const { data: members, error: membersError } = await supabase
    .from("mess_members")
    .select("user_id")
    .eq("mess_id", month.mess_id)
    .eq("status", "active")

  if (membersError || !members || members.length === 0) {
    return { error: "No active members found" }
  }

  const memberIds = members.map(m => m.user_id)

  // 3. Round-Robin Logic
  // Total slots needed = totalTrips * membersPerTrip
  const totalSlots = totalTrips * membersPerTrip
  let assignedMembers: string[] = []

  // Repeat members list until we have enough slots
  while (assignedMembers.length < totalSlots) {
    assignedMembers = [...assignedMembers, ...memberIds]
  }
  // Trim to exact number needed
  assignedMembers = assignedMembers.slice(0, totalSlots)

  // 4. Create Schedules and Shoppers
  const schedulesToInsert = []
  let currentDate = startDate

  for (let i = 0; i < totalTrips; i++) {
    // Determine members for this trip
    const tripMembers = assignedMembers.slice(i * membersPerTrip, (i + 1) * membersPerTrip)

    // Create Schedule Record
    // We insert schedules sequentially.
    // Supabase JS insert can handle bulk, but we need the IDs for the shopper mapping.
    // It's safer to do a loop or careful bulk op. A loop is easier to reason about for relations.

    const { data: schedule, error: insertError } = await supabase
        .from("bazaar_schedules")
        .insert({
            month_id: monthId,
            mess_id: month.mess_id,
            date: format(currentDate, "yyyy-MM-dd"),
            created_by: user.id
        })
        .select()
        .single()

    if (insertError) {
        console.error("Error inserting schedule inside loop:", insertError)
        continue // Skip or abort?
    }

    if (schedule && tripMembers.length > 0) {
        const shoppersData = tripMembers.map(uid => ({
            schedule_id: schedule.id,
            user_id: uid
        }))

        await supabase.from("bazaar_shoppers").insert(shoppersData)
    }

    // Increment date by frequency
    currentDate = addDays(currentDate, frequency)
  }

  revalidatePath("/dashboard")
  return { success: true }
}

/**
 * Mark schedule as completed
 */
export async function completeSchedule(scheduleId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "Unauthorized" }

    // Fetch schedule to check permissions
    const { data: schedule, error: fetchError } = await supabase
        .from("bazaar_schedules")
        .select("*, shoppers:bazaar_shoppers(user_id)")
        .eq("id", scheduleId)
        .single()

    if (fetchError || !schedule) return { error: "Schedule not found" }

    // Check if user is manager OR one of the shoppers
    const isShopper = schedule.shoppers.some((s: any) => s.user_id === user.id)

    // Check manager role
    let isManager = false
    if (!isShopper) {
        const { data: membership } = await supabase
            .from("mess_members")
            .select("role, can_manage_meals")
            .eq("mess_id", schedule.mess_id)
            .eq("user_id", user.id)
            .single()

        if (membership && (membership.role === 'manager' || membership.can_manage_meals)) {
            isManager = true
        }
    }

    if (!isShopper && !isManager) {
        return { error: "Permission denied" }
    }

    const { error } = await supabase
        .from("bazaar_schedules")
        .update({ status: 'completed' })
        .eq("id", scheduleId)

    if (error) return { error: "Failed to update status" }

    revalidatePath("/dashboard")
    return { success: true }
}

/**
 * Delete a specific bazaar schedule
 */
export async function deleteSchedule(scheduleId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "Unauthorized" }

    // Fetch schedule to check permissions
    const { data: schedule, error: fetchError } = await supabase
        .from("bazaar_schedules")
        .select("mess_id")
        .eq("id", scheduleId)
        .single()

    if (fetchError || !schedule) return { error: "Schedule not found" }

    // Check manager role
    const { data: membership } = await supabase
        .from("mess_members")
        .select("role, can_manage_meals")
        .eq("mess_id", schedule.mess_id)
        .eq("user_id", user.id)
        .single()

    if (!membership || (membership.role !== 'manager' && !membership.can_manage_meals)) {
        return { error: "Permission denied" }
    }

    const { error } = await supabase
        .from("bazaar_schedules")
        .delete()
        .eq("id", scheduleId)

    if (error) return { error: "Failed to delete schedule" }

    revalidatePath("/dashboard")
    return { success: true }
}

/**
 * Delete all schedules for a month
 */
export async function deleteAllSchedules(monthId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "Unauthorized" }

    // Get mess_id from month
    const { data: month } = await supabase
        .from("months")
        .select("mess_id")
        .eq("id", monthId)
        .single()

    if (!month) return { error: "Month not found" }

    // Check manager role
    const { data: membership } = await supabase
        .from("mess_members")
        .select("role, can_manage_meals")
        .eq("mess_id", month.mess_id)
        .eq("user_id", user.id)
        .single()

    if (!membership || (membership.role !== 'manager' && !membership.can_manage_meals)) {
        return { error: "Permission denied" }
    }

    const { error } = await supabase
        .from("bazaar_schedules")
        .delete()
        .eq("month_id", monthId)

    if (error) return { error: "Failed to delete schedules" }

    revalidatePath("/dashboard")
    return { success: true }
}

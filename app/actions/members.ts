"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { broadcastNotification } from "./notifications"

export async function updateMemberPermissions(
    memberId: string, 
    permissions: { 
        can_manage_meals: boolean, 
        can_manage_finance: boolean, 
        can_manage_members: boolean 
    }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  // Check if current user is manager
  const { data: currentUser } = await supabase
    .from("mess_members")
    .select("mess_id, role")
    .eq("user_id", user.id)
    .single()

  if (!currentUser || currentUser.role !== 'manager') {
      return { error: "Unauthorized: Only managers can update permissions." }
  }

  // Update target member
  const { error } = await supabase
    .from("mess_members")
    .update(permissions)
    .eq("user_id", memberId)
    .eq("mess_id", currentUser.mess_id)

  if (error) {
      console.error("Update permissions error:", error)
      return { error: "Failed to update permissions. Ensure database schema is up to date." }
  }
  
  // Notify
  await broadcastNotification(currentUser.mess_id, "Permissions Updated", "Your permissions have been updated by the manager.", memberId)

  revalidatePath("/dashboard/members")
  return { success: true }
}

export async function transferManagership(newManagerId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  // Verify current user is manager
  const { data: currentUser } = await supabase
    .from("mess_members")
    .select("mess_id, role")
    .eq("user_id", user.id)
    .single()

  if (!currentUser || currentUser.role !== 'manager') {
      return { error: "Unauthorized" }
  }
  
  // 1. Promote New Manager
  const { error: promoteError } = await supabase
    .from("mess_members")
    .update({
        role: 'manager',
        can_manage_meals: true,
        can_manage_finance: true,
        can_manage_members: true
    })
    .eq("user_id", newManagerId)
    .eq("mess_id", currentUser.mess_id)

  if (promoteError) {
      console.error("Promote error:", promoteError)
      return { error: "Failed to promote new manager" }
  }

  // 2. Demote Self
  const { error: demoteError } = await supabase
    .from("mess_members")
    .update({ role: 'member' })
    .eq("user_id", user.id)
    .eq("mess_id", currentUser.mess_id)

  if (demoteError) {
      // Critical error! We have 2 managers now.
      // Log it. It's acceptable for now.
      console.error("Demote error (CRITICAL):", demoteError)
      return { error: "Failed to demote yourself. Both are managers now." }
  }
  
  // Update profiles table roles?
  // Ideally yes, but the app seems to rely on mess_members role for dashboard access.
  // Profile role is global, so it might be confusing if they manage one mess but not another (if multi-mess supported).
  // Current app seems single-mess.

  await supabase.from("profiles").update({ role: 'manager' }).eq("id", newManagerId)
  await supabase.from("profiles").update({ role: 'member' }).eq("id", user.id)

  await broadcastNotification(currentUser.mess_id, "Manager Changed", "Managership has been transferred.")

  revalidatePath("/dashboard")
  return { success: true }
}

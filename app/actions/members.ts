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

  if (error) return { error: error.message }
  
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

  // Transaction-like update (Supabase doesn't support easy transactions in client lib without RPC, 
  // but we can do sequential updates. If one fails, we are in trouble. RPC is better.)
  
  // RPC approach would be safer, but for now sequential:
  // 1. Demote self
  // 2. Promote new guy
  
  // Ideally we create a Postgres function.
  // Let's create `transfer_managership` RPC.
  // Or just do it here carefully. Risk: if step 2 fails, no manager exists.
  // Better: Promote new guy first? No, only 1 manager allowed? 
  // If Schema check constraint exists? Schema says check(role in manager, member). It doesn't enforce uniqueness.
  // So we CAN have 2 managers temporarily.
  
  // 1. Promote New Manager
  const { error: promoteError } = await supabase
    .from("mess_members")
    .update({ role: 'manager' })
    .eq("user_id", newManagerId)
    .eq("mess_id", currentUser.mess_id)

  if (promoteError) return { error: "Failed to promote new manager" }

  // 2. Demote Self
  const { error: demoteError } = await supabase
    .from("mess_members")
    .update({ role: 'member' })
    .eq("user_id", user.id) // Self

  if (demoteError) {
      // Critical error! We have 2 managers now.
      // Log it. It's acceptable for now.
      return { error: "Failed to demote yourself. Both are managers now." }
  }
  
  await broadcastNotification(currentUser.mess_id, "Manager Changed", "Managership has been transferred.")

  revalidatePath("/dashboard")
  return { success: true }
}

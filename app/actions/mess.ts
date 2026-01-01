"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createMess(formData: FormData) {
  const supabase = await createClient()
  
  const name = formData.get("name") as string
  const user = await supabase.auth.getUser()
  const userId = user.data.user?.id

  if (!userId) return { error: "Not authenticated" }

  // 1. Create Mess
  const code = Math.random().toString(36).substring(2, 8).toUpperCase()
  
  const { data: mess, error: messError } = await supabase
    .from("messes")
    .insert({
      name,
      created_by: userId,
      code,
    })
    .select()
    .single()

  if (messError) return { error: messError.message }

  // 2. Add Creator as Manager in Mess Members
  const { error: memberError } = await supabase
    .from("mess_members")
    .insert({
      mess_id: mess.id,
      user_id: userId,
      role: "manager",
      status: "active",
    })

  if (memberError) return { error: memberError.message }

  // 3. Update Profile Role
  await supabase
    .from("profiles")
    .update({ role: "manager" })
    .eq("id", userId)

  revalidatePath("/dashboard")
  return { success: true }
}

export async function joinMess(formData: FormData) {
  const supabase = await createClient()
  
  const code = (formData.get("code") as string).toUpperCase()
  const user = await supabase.auth.getUser()
  const userId = user.data.user?.id

  if (!userId) return { error: "Not authenticated" }

  // 1. Find Mess by Code
  const { data: mess, error: messError } = await supabase
    .from("messes")
    .select("id")
    .eq("code", code)
    .single()

  if (messError || !mess) return { error: "Mess not found with this code" }

  // 2. Create Join Request
  const { error: joinError } = await supabase
    .from("mess_members")
    .insert({
      mess_id: mess.id,
      user_id: userId,
      role: "member",
      status: "pending",
    })

  if (joinError) {
    if (joinError.code === "23505") return { error: "You have already joined this mess" } // Unique constraint violation
    return { error: joinError.message }
  }

  revalidatePath("/dashboard")
  return { success: true }
}

export async function searchMess(codeInput: string) {
  const supabase = await createClient()
  const code = codeInput.toUpperCase()
  
  const { data: mess, error } = await supabase
    .from("messes")
    .select("id, code, name, created_by, profiles(name)")
    .eq("code", code)
    .single()

  if (error || !mess) return { error: "Mess not found" }
  
  return { mess }
}

export async function deleteMess(messId: string) {
  const supabase = await createClient()
  
  // Verify permissions (only created_by or manager can delete)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const { data: mess } = await supabase
    .from("messes")
    .select("created_by")
    .eq("id", messId)
    .single()
    
  if (!mess || mess.created_by !== user.id) {
      // Fallback check: is user a manager?
      const { data: member } = await supabase.from("mess_members").select("role").eq("mess_id", messId).eq("user_id", user.id).single()
      if (member?.role !== 'manager') {
          return { error: "Unauthorized" }
      }
  }

  const { error } = await supabase
    .from("messes")
    .delete()
    .eq("id", messId)

  if (error) return { error: error.message }
  
  // also reset user role? Not strictly necessary as trigger might handle or they just become stateless
  revalidatePath("/")
  return { success: true }
}
// ... (existing deleteMess above)

export async function approveMember(userId: string, messId: string) {
  const supabase = await createClient()
  
  // Verify Manager Status
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const { data: manager } = await supabase.from("mess_members")
    .select("role")
    .eq("mess_id", messId)
    .eq("user_id", user.id)
    .single()
    
  if (manager?.role !== 'manager') return { error: "Unauthorized" }

  const { error } = await supabase
    .from("mess_members")
    .update({ status: 'active' })
    .eq("user_id", userId)
    .eq("mess_id", messId)

  if (error) return { error: error.message }
  
  revalidatePath("/dashboard/members")
  return { success: true }
}

export async function rejectMember(userId: string, messId: string) {
  const supabase = await createClient()

    // Verify Manager Status
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const { data: manager } = await supabase.from("mess_members")
    .select("role")
    .eq("mess_id", messId)
    .eq("user_id", user.id)
    .single()
    
  if (manager?.role !== 'manager') return { error: "Unauthorized" }

  const { error } = await supabase
    .from("mess_members")
    .delete()
    .eq("user_id", userId)
    .eq("mess_id", messId)

  if (error) return { error: error.message }

  revalidatePath("/dashboard/members")
  return { success: true }
}
// ... existing imports ...

export async function leaveMess() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  // Check if user is manager (creator shouldn't leave easily without transfer - for now allow but maybe warn? simple implementation for now)
  const { data: member } = await supabase.from("mess_members").select("role, mess_id").eq("user_id", user.id).single()
  
  if (!member) return { error: "No mess found" }

  // Perform Leave
  const { error } = await supabase
    .from("mess_members")
    .delete()
    .eq("user_id", user.id)
    .eq("mess_id", member.mess_id)

  if (error) return { error: error.message }
  
  revalidatePath("/dashboard")
  return { success: true }
}

export async function removeMember(userId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  // Verify Manager
  const { data: manager } = await supabase.from("mess_members").select("mess_id, role").eq("user_id", user.id).single()
  
  if (manager?.role !== 'manager') return { error: "Unauthorized" }

  // Prevent removing self (use leave instead)
  if (userId === user.id) return { error: "Cannot remove yourself. Use Leave Mess." }

  const { error } = await supabase
    .from("mess_members")
    .update({ status: 'removed' }) // Or delete? "Remove member form the mess". Delete is cleaner for now.
    .eq("user_id", userId)
    .eq("mess_id", manager.mess_id)
  
  // Actually, let's DELETE them so they can rejoin if needed, or set status to banned? 
  // User said "remove member". Delete is best.
  
  const { error: deleteError } = await supabase
     .from("mess_members")
     .delete()
     .eq("user_id", userId)
     .eq("mess_id", manager.mess_id)

  if (deleteError) return { error: deleteError.message }

  revalidatePath("/dashboard/members")
  return { success: true }
}

export async function addMemberByEmail(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const email = formData.get("email") as string
  if (!email) return { error: "Email is required" }

  // 1. Verify Manager
  const { data: manager } = await supabase.from("mess_members").select("mess_id, role").eq("user_id", user.id).single()
  if (manager?.role !== 'manager') return { error: "Unauthorized" }

  // 2. Find User by Email (in profiles)
  const { data: profile } = await supabase.from("profiles").select("id").eq("email", email).single()
  
  if (!profile) return { error: "User not found with this email. They must sign up first." }

  // 3. Check if already member
  const { data: existing } = await supabase.from("mess_members")
    .select("status")
    .eq("mess_id", manager.mess_id)
    .eq("user_id", profile.id)
    .maybeSingle()

  if (existing) {
      if (existing.status === 'active') return { error: "User is already an active member." }
      if (existing.status === 'pending') return { error: "User already has a pending request." }
      // if removed, we can re-add?
  }

  // 4. Add Member (Directly Active)
  const { error } = await supabase.from("mess_members").insert({
      mess_id: manager.mess_id,
      user_id: profile.id,
      role: 'member',
      status: 'active'
  })

  if (error) return { error: error.message }
  
  revalidatePath("/dashboard/members")
  return { success: true }
}

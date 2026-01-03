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

  // Check if name looks like a mess code (6 chars, uppercase alphanumeric)
  const messCodePattern = /^[A-Z0-9]{6}$/
  if (messCodePattern.test(name.toUpperCase())) {
     // It looks like a code. Check if it IS a code.
     const { data: existingMess } = await supabase
        .from("messes")
        .select("id")
        .eq("code", name.toUpperCase())
        .maybeSingle()

     if (existingMess) {
         return { error: "The name you entered looks like a Mess Code. Did you mean to 'Join a Mess' instead?" }
     }
  }

  // Check if user is already in a mess (active or pending)
  const { data: currentMembership } = await supabase
    .from("mess_members")
    .select("id")
    .eq("user_id", userId)
    .in("status", ["active", "pending"])
    .maybeSingle()

  if (currentMembership) {
      return { error: "You are already a member of a mess. Please leave your current mess first." }
  }

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

  if (messError) {
      if (messError.code === '23505') { // Unique violation
          if (messError.message.includes("name")) return { error: "A mess with this name already exists." }
      }
      return { error: messError.message }
  }

  // 2. Add Creator as Manager in Mess Members
  const { error: memberError } = await supabase
    .from("mess_members")
    .insert({
      mess_id: mess.id,
      user_id: userId,
      role: "manager",
      status: "active",
      can_manage_meals: true,
      can_manage_finance: true,
      can_manage_members: true
    })

  if (memberError) return { error: memberError.message }

  // 3. Update Profile Role (Handled by Trigger)
  // The 'on_mess_member_change' trigger will automatically update the profile role.

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

  // Check if user is already in ANY mess (active or pending)
  const { data: currentAnyMembership } = await supabase
    .from("mess_members")
    .select("id, mess_id, status")
    .eq("user_id", userId)
    .in("status", ["active", "pending"])
    .maybeSingle()

  if (currentAnyMembership) {
      if (currentAnyMembership.mess_id !== mess.id) {
          return { error: "You are already a member of another mess." }
      }
      // If same mess, handle below
  }

  // 2. Check if user was previously a member (even if removed/rejected)
  const { data: existingMember } = await supabase
    .from("mess_members")
    .select("id, status")
    .eq("mess_id", mess.id)
    .eq("user_id", userId)
    .maybeSingle()

  if (existingMember) {
      // If they are active or pending, return error
      if (existingMember.status === 'active') return { error: "You are already a member of this mess" }
      if (existingMember.status === 'pending') return { error: "You already have a pending request" }

      // If removed or rejected, we can restart them.
      // Reset permissions to default false.
      const { error: updateError } = await supabase
        .from("mess_members")
        .update({
            status: 'pending',
            role: 'member',
            can_manage_meals: false,
            can_manage_finance: false,
            can_manage_members: false,
            joined_at: new Date().toISOString()
        })
        .eq("id", existingMember.id)

      if (updateError) return { error: updateError.message }
  } else {
      // 3. Create New Join Request
      const { error: joinError } = await supabase
        .from("mess_members")
        .insert({
          mess_id: mess.id,
          user_id: userId,
          role: "member",
          status: "pending",
          can_manage_meals: false,
          can_manage_finance: false,
          can_manage_members: false
        })

      if (joinError) return { error: joinError.message }
  }

  // 4. Update Profile Role (Handled by Trigger)
  // The 'on_mess_member_change' trigger will automatically update the profile role.

  revalidatePath("/dashboard")
  return { success: true }
}

export async function searchMess(codeInput: string) {
  const supabase = await createClient()
  const code = codeInput.toUpperCase()
  
  // Find mess first
  const { data: mess, error } = await supabase
    .from("messes")
    .select("id, code, name")
    .eq("code", code)
    .single()

  if (error || !mess) return { error: "Mess not found" }
  
  // Find current manager name from mess_members
  // Use maybeSingle to prevent crashing if multiple managers exist (though shouldn't happen)
  // Or even better, limit(1) to just get ONE manager if multiple exist to keep flow working.
  const { data: manager } = await supabase
    .from("mess_members")
    .select("profiles(name)")
    .eq("mess_id", mess.id)
    .eq("role", "manager")
    .limit(1)
    .maybeSingle()

  const result = {
      ...mess,
      created_by: null,
      profiles: manager?.profiles || { name: "Unknown Manager" }
  }

  return { mess: result }
}

export async function deleteMess(messId: string) {
  const supabase = await createClient()
  
  // Verify permissions (only MANAGER can delete)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  // Strict check: Must be a manager in mess_members. Created_by is irrelevant for permission.
  const { data: member } = await supabase
    .from("mess_members")
    .select("role")
    .eq("mess_id", messId)
    .eq("user_id", user.id)
    .single()

  if (!member || member.role !== 'manager') {
      return { error: "Unauthorized: Only the current manager can delete the mess." }
  }

  // Manual cleanup of dependent records (in case Cascade is not applied in DB)
  // 1. Get all Month IDs for this mess
  const { data: months } = await supabase.from("months").select("id").eq("mess_id", messId)
  const monthIds = months?.map(m => m.id) || []

  if (monthIds.length > 0) {
      // 2. Delete data linked to months
      // Expenses
      const { data: expenses } = await supabase.from("expenses").select("id").in("month_id", monthIds)
      const expenseIds = expenses?.map(e => e.id) || []
      if(expenseIds.length > 0) {
          await supabase.from("expense_allocations").delete().in("expense_id", expenseIds)
      }
      await supabase.from("expenses").delete().in("month_id", monthIds)

      // Deposits & Meals
      await supabase.from("deposits").delete().in("month_id", monthIds)
      await supabase.from("meals").delete().in("month_id", monthIds)

      // Delete Months
      await supabase.from("months").delete().in("id", monthIds)
  }

  // 3. Delete Notices, Notifications & Members
  // Trigger will handle resetting profile roles to 'user' upon member deletion.
  await supabase.from("notices").delete().eq("mess_id", messId)
  await supabase.from("notifications").delete().eq("mess_id", messId)
  await supabase.from("mess_members").delete().eq("mess_id", messId)

  // 4. Finally Delete Mess
  const { error } = await supabase
    .from("messes")
    .delete()
    .eq("id", messId)

  if (error) return { error: error.message }
  
  revalidatePath("/")
  return { success: true }
}

export async function approveMember(userId: string, messId: string) {
  const supabase = await createClient()
  
  // Verify Manager Status
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  // Check if current user has permission to manage members
  const { data: member } = await supabase.from("mess_members")
    .select("role, can_manage_members")
    .eq("mess_id", messId)
    .eq("user_id", user.id)
    .single()
    
  if (!member || (member.role !== 'manager' && !member.can_manage_members)) return { error: "Unauthorized" }

  const { error } = await supabase
    .from("mess_members")
    .update({ status: 'active' })
    .eq("user_id", userId)
    .eq("mess_id", messId)

  if (error) return { error: error.message }
  
  // Profile Role updated by Trigger
  revalidatePath("/dashboard/members")
  return { success: true }
}

export async function rejectMember(userId: string, messId: string) {
  const supabase = await createClient()

  // Verify Manager Status
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  // Check if current user has permission to manage members
  const { data: member } = await supabase.from("mess_members")
    .select("role, can_manage_members")
    .eq("mess_id", messId)
    .eq("user_id", user.id)
    .single()
    
  if (!member || (member.role !== 'manager' && !member.can_manage_members)) return { error: "Unauthorized" }

  const { error } = await supabase
    .from("mess_members")
    .delete()
    .eq("user_id", userId)
    .eq("mess_id", messId)

  if (error) return { error: error.message }

  // Profile Role updated by Trigger
  revalidatePath("/dashboard/members")
  return { success: true }
}

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

  // Profile Role updated by Trigger
  revalidatePath("/dashboard")
  return { success: true }
}

export async function removeMember(userId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  // Verify Permissions
  const { data: manager } = await supabase.from("mess_members")
      .select("mess_id, role, can_manage_members")
      .eq("user_id", user.id)
      .single()
  
  if (!manager || (manager.role !== 'manager' && !manager.can_manage_members)) return { error: "Unauthorized" }

  // Prevent removing self (use leave instead)
  if (userId === user.id) return { error: "Cannot remove yourself. Use Leave Mess." }

  // If removing a manager? Only manager can remove another member.
  // Wait, can a member with 'can_manage_members' remove the Manager? No, that should be blocked.
  const { data: target } = await supabase.from("mess_members").select("role").eq("user_id", userId).eq("mess_id", manager.mess_id).single()
  if (target?.role === 'manager') return { error: "Cannot remove the manager." }

  const { error: deleteError } = await supabase
     .from("mess_members")
     .delete()
     .eq("user_id", userId)
     .eq("mess_id", manager.mess_id)

  if (deleteError) return { error: deleteError.message }

  // Profile Role updated by Trigger
  revalidatePath("/dashboard/members")
  return { success: true }
}

export async function addMemberByEmail(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  let email = formData.get("email") as string
  if (!email) return { error: "Email is required" }
  email = email.trim()

  // 1. Verify Permissions
  const { data: manager } = await supabase.from("mess_members")
      .select("mess_id, role, can_manage_members")
      .eq("user_id", user.id)
      .single()

  if (!manager || (manager.role !== 'manager' && !manager.can_manage_members)) return { error: "Unauthorized" }

  // 2. Find User by Email (in profiles)
  const { data: profile } = await supabase.from("profiles").select("id").ilike("email", email).maybeSingle()
  
  if (!profile) return { error: "User not found with this email. They must sign up first." }

  // Check if target user is already in ANY mess
  const { data: targetMembership } = await supabase
    .from("mess_members")
    .select("mess_id")
    .eq("user_id", profile.id)
    .in("status", ["active", "pending"])
    .maybeSingle()

  if (targetMembership) {
      return { error: "This user is already a member of a mess." }
  }

  // 3. Check if already member of THIS mess (redundant but safe for history)
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
  // Ensure default permissions are false for new members added by email
  const { error } = await supabase.from("mess_members").insert({
      mess_id: manager.mess_id,
      user_id: profile.id,
      role: 'member',
      status: 'active',
      can_manage_meals: false,
      can_manage_finance: false,
      can_manage_members: false
  })

  if (error) return { error: error.message }

  // Profile Role updated by Trigger
  revalidatePath("/dashboard/members")
  return { success: true }
}

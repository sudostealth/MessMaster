"use server"

import { createClient } from "@/lib/supabase/server"
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

export async function createMemberAccount(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const phone = formData.get("phone") as string

  if (!name || !email || !password) return { error: "Name, Email and Password are required" }

  // 1. Check Manager Permission
  const { data: manager } = await supabase
    .from("mess_members")
    .select("mess_id, role")
    .eq("user_id", user.id)
    .single()

  if (!manager || manager.role !== 'manager') {
      return { error: "Unauthorized: Only managers can create accounts." }
  }

  // 2. Initialize Admin Client
  // Using the key provided for this specific task
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "sb_secret_2ETHFLaILZB1mt2Tqhhb7A_dG5ohVEj"
  const ADMIN_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!

  if (!SERVICE_KEY || !ADMIN_URL) return { error: "Server configuration error" }

  const adminAuth = createSupabaseAdmin(ADMIN_URL, SERVICE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  // 3. Create Auth User
  const { data: newUser, error: createError } = await adminAuth.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, phone }
  })

  if (createError) {
      return { error: createError.message }
  }

  if (!newUser.user) return { error: "Failed to create user" }

  // 4. Add to Mess Members
  const { error: memberError } = await adminAuth
    .from("mess_members")
    .insert({
        mess_id: manager.mess_id,
        user_id: newUser.user.id,
        role: 'member',
        status: 'active',
        can_manage_meals: false,
        can_manage_finance: false,
        can_manage_members: false
    })

  if (memberError) {
      // Cleanup if possible? Or just return error.
      // If we fail here, we have an orphan user.
      await adminAuth.auth.admin.deleteUser(newUser.user.id)
      return { error: "Failed to add member to mess: " + memberError.message }
  }
  
  // 5. Explicitly ensure Profile is updated
  // The trigger 'handle_new_user' runs on AUTH creation, but we explicitly update to ensure phone is set if metadata failed.
  await adminAuth
    .from("profiles")
    .update({ name, phone })
    .eq("id", newUser.user.id)

  revalidatePath("/dashboard/members")
  revalidatePath("/dashboard/add-member")
  
  return { success: true }
}

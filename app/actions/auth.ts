"use server"

import { createClient } from "@/lib/supabase/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

export async function updateProfile(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Not authenticated" }

    const name = formData.get("name") as string
    const phone = formData.get("phone") as string

    if (!name) return { error: "Name is required" }

    const { error } = await supabase
        .from("profiles")
        .update({ name, phone })
        .eq("id", user.id)

    if (error) return { error: error.message }
    
    revalidatePath("/dashboard/settings")
    return { success: true }
}

export async function updateEmail(email: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Not authenticated" }

    const { error } = await supabase.auth.updateUser({ email })

    if (error) return { error: error.message }

    return { success: true }
}

export async function updatePassword(password: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Not authenticated" }

    const { error } = await supabase.auth.updateUser({ password })

    if (error) return { error: error.message }

    return { success: true }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}

export async function deleteAccount() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "Not authenticated" }

    // 1. Check if Manager of Active Mess
    const { data: membership } = await supabase
        .from("mess_members")
        .select("role, status, messes(id, name)")
        .eq("user_id", user.id)
        .in("status", ["active", "pending"])
        .maybeSingle()

    if (membership && membership.role === 'manager' && membership.status === 'active') {
        return { error: `You are the Manager of ${Array.isArray(membership.messes) ? membership.messes[0]?.name : (membership.messes as any)?.name}. Please transfer ownership or delete the mess first.` }
    }

    // 2. Initialize Admin Client
    // NOTE: In a real production env, use process.env.SUPABASE_SERVICE_ROLE_KEY
    // We use the key provided by the user for this specific task context.
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "sb_secret_j4Yv6Gq8pu70wjCDzGGhIQ_AKcC72kt"
    const ADMIN_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!

    if (!SERVICE_KEY) return { error: "Service configuration missing." }

    const supabaseAdmin = createSupabaseClient(ADMIN_URL, SERVICE_KEY, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })

    // 3. Delete User (Auth) - This cascades if configured, or leaves orphans if not.
    // We configured DB to CASCADE or SET NULL in fix_db_v5.sql
    const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id)

    if (error) {
        console.error("Delete user error:", error)
        return { error: "Failed to delete account. Please try again." }
    }

    // 4. Manual Cleanup of Profile (if Auth cascade isn't set up on database level)
    // Attempt to delete profile just in case
    await supabaseAdmin.from("profiles").delete().eq("id", user.id)

    return { success: true }
}

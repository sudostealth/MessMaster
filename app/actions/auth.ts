"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

// ... imports

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

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}

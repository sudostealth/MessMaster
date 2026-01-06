"use server"

import { createClient } from "@/lib/supabase/server"

export async function getMessMembers(messId: string) {
    const supabase = await createClient()

    const { data: members, error } = await supabase
        .from("mess_members")
        .select(`
            *,
            profiles:user_id(name, email, avatar_url)
        `)
        .eq("mess_id", messId)
        .eq("status", "active")
        .order("joined_at", { ascending: true })

    if (error) {
        console.error("Error fetching mess members:", error)
        return []
    }

    return members
}

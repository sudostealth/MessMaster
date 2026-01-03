"use server"

import { createClient } from "@/lib/supabase/server"

export async function broadcastNotification(messId: string, title: string, message: string, excludeUserId?: string, monthId?: string) {
  const supabase = await createClient()

  // Get active members
  const { data: members, error } = await supabase
    .from("mess_members")
    .select("user_id")
    .eq("mess_id", messId)
    .eq("status", "active")
  
  if (error || !members || members.length === 0) return

  const notifications = members
    .filter(m => m.user_id !== excludeUserId) // proper filter
    .map(m => ({
        user_id: m.user_id,
        title,
        message,
        mess_id: messId,
        month_id: monthId || null,
        created_at: new Date().toISOString()
    }))

  if (notifications.length > 0) {
      await supabase.from("notifications").insert(notifications)
  }
}

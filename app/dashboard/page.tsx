import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getDashboardStats } from "@/app/actions/stats"
import { DashboardContent } from "@/components/dashboard/dashboard-content"
import { getBazaarSchedules } from "@/app/actions/bazaar"
import { getMessMembers } from "@/app/actions/members_helper"

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return redirect("/login")
  }

  // Check if user is part of any mess
  const { data: membership } = await supabase
    .from("mess_members")
    .select("*, messes(*)")
    .eq("user_id", user.id)
    .maybeSingle()

  let stats = null
  let message = ""
  let bazaarSchedules: any[] = []
  let messMembers: any[] = []

  if (membership && membership.status === 'active') {
    // User is active, show actual dashboard
    const res = await getDashboardStats()
    stats = res.data
    message = res.message || ""

    if (stats?.monthId) {
       // Fetch Bazaar Schedules
       const bazaarRes = await getBazaarSchedules(stats.monthId)
       if (bazaarRes.data) {
          bazaarSchedules = bazaarRes.data
       }

       // Fetch Members for Scheduler
       messMembers = await getMessMembers(membership.mess_id)
    }
  }

  return (
    <DashboardContent
        user={user}
        membership={membership}
        stats={stats}
        message={message}
        bazaarSchedules={bazaarSchedules}
        messMembers={messMembers}
    />
  )
}

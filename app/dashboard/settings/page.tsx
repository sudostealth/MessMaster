import { createClient } from "@/lib/supabase/server"
import { ProfileManager } from "@/components/profile/profile-manager"
import { MonthManager } from "@/components/dashboard/month-manager"

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user?.id)
    .single()

  const { data: member } = await supabase
    .from("mess_members")
    .select("mess_id, role")
    .eq("user_id", user?.id)
    .eq("status", "active")
    .maybeSingle()

  // Fetch Month Data for Manager
  let activeMonth = null
  let pastMonths = []
  
  if (member?.mess_id) {
      const { data: am } = await supabase.from("months").select("*").eq("mess_id", member.mess_id).eq("is_active", true).maybeSingle()
      activeMonth = am

      const { data: pm } = await supabase.from("months").select("*").eq("mess_id", member.mess_id).eq("is_active", false).order("created_at", { ascending: false })
      pastMonths = pm || []
  }

  return (
    <div className="container py-8 space-y-6">
      <ProfileManager profile={profile} messId={member?.mess_id} />
      
      {member?.role === 'manager' && (
          <MonthManager 
             activeMonth={activeMonth}
             pastMonths={pastMonths}
             isManager={true}
          />
      )}
    </div>
  )
}

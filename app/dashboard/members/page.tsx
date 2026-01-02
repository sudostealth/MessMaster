import { createClient } from "@/lib/supabase/server"
import { MembersPageContent } from "@/components/members/members-page-content"

export default async function MembersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: myMembership } = await supabase.from("mess_members").select("mess_id, role").eq("user_id", user?.id).maybeSingle()

  // if (!myMembership) logic handled in content or here? Better pass null membership to content and let it handle UI.
  // Actually original code returned early. Let's keep logic similar but pass data.
  
  let allMembers: any[] = []

  if (myMembership) {
      const { data } = await supabase
        .from("mess_members")
        .select("user_id, mess_id, role, status, can_manage_meals, can_manage_finance, can_manage_members, profiles(name, email, phone, avatar_url)")
        .eq("mess_id", myMembership.mess_id)
        .eq("status", "active")
        .order("role", { ascending: true })
      
      allMembers = data || []
  }

  return <MembersPageContent allMembers={allMembers} myMembership={myMembership} user={user} />
}

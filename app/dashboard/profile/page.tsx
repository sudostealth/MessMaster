import { createClient } from "@/lib/supabase/server"
import { ProfilePageContent } from "@/components/profile/profile-page-content"

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return <div>Not authenticated</div>

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  const { data: member } = await supabase
    .from("mess_members")
    .select("role, status, messes(name)")
    .eq("user_id", user.id)
    .maybeSingle()

  return <ProfilePageContent profile={profile} member={member} />
}

import { createClient } from "@/lib/supabase/server"
import { MealManager } from "@/components/meals/meal-manager"

export default async function MealDetailsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 1. Get Mess ID and Month
  const { data: member } = await supabase
    .from("mess_members")
    .select("mess_id, role, can_manage_meals")
    .eq("user_id", user?.id)
    .maybeSingle()
  
  if (!member) return <div className="p-8 text-center text-muted-foreground">Please join or create a mess to manage meals.</div>

  const { data: activeMonth } = await supabase.from("months").select("*").eq("mess_id", member.mess_id).eq("is_active", true).maybeSingle()

  if (!activeMonth) {
     return <div className="p-8 text-center text-muted-foreground">No active month found. Ask your manager to start a month.</div>
  }

  // 2. Fetch All Members
  const { data: members } = await supabase
    .from("mess_members")
    .select("user_id, role, profiles(name, avatar_url)")
    .eq("mess_id", member?.mess_id)
    .eq("status", "active")
    .order("role", { ascending: true }) // Managers first

  // 3. Fetch Meals
  const { data: meals } = await supabase
    .from("meals")
    .select("id, date, breakfast, lunch, dinner, user_id") // Added 'id' for deletion
    .eq("month_id", activeMonth.id)

  return (
    <div className="container py-8">
       <MealManager 
          members={members || []} 
          meals={meals || []} 
          month={activeMonth} 
          currentUserId={user?.id || ""}
          isManager={member.role === 'manager' || member.can_manage_meals}
       />
    </div>
  )
}

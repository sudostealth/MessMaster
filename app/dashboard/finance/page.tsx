import { createClient } from "@/lib/supabase/server"
import { FinanceManager } from "@/components/finance/finance-manager"

export default async function FinanceDetailsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return <div className="p-8 text-center text-muted-foreground">Not authenticated.</div>

  const { data: member } = await supabase.from("mess_members").select("mess_id, role").eq("user_id", user?.id).maybeSingle()
  
  if (!member) return <div className="p-8 text-center text-muted-foreground">Please join or create a mess to view finances.</div>

  const activeMonth = await supabase.from("months").select("id").eq("mess_id", member.mess_id).eq("is_active", true).maybeSingle()
  
  if (!activeMonth.data) return <div className="p-8 text-center text-muted-foreground">No active month.</div>
  const monthId = activeMonth.data.id

  // Fetch Deposits
  const { data: deposits } = await supabase
    .from("deposits")
    .select(`
        id,
        date,
        amount,
        details,
        user_id,
        profiles:user_id(name),
        added_by_profile:profiles!deposits_added_by_fkey(name)
    `)
    .eq("month_id", monthId)
    .order("date", { ascending: false })

  // Fetch Expenses
  const { data: expenses } = await supabase
    .from("expenses")
    .select(`
        id,
        date,
        amount,
        details,
        category,
        shopper_id,
        involved_members,
        profiles:shopper_id(name),
        added_by_profile:profiles!expenses_added_by_fkey(name)
    `)
    .eq("month_id", monthId)
    .order("date", { ascending: false })

  const isManager = member.role === 'manager'

  return (
    <div className="container py-8">
      <FinanceManager 
          expenses={expenses || []} 
          deposits={deposits || []} 
          currentUserId={user.id} 
          isManager={isManager} 
      />
    </div>
  )
}

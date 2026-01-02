import { createClient } from "@/lib/supabase/server"
import { Sidebar } from "@/components/layout/sidebar"
import { MobileNav } from "@/components/layout/mobile-nav"
import { redirect } from "next/navigation"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Fetch role and permissions
  const { data: member } = await supabase
    .from("mess_members")
    .select("role, can_manage_meals, can_manage_finance, can_manage_members")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle()
  
  const role = member?.role || "member"
  const permissions = {
      can_manage_meals: member?.can_manage_meals || false,
      can_manage_finance: member?.can_manage_finance || false,
      can_manage_members: member?.can_manage_members || false,
  }

  return (
    <div className="flex container p-0 max-w-full">
       <div className="hidden md:block">
          <Sidebar role={role} permissions={permissions} />
       </div>
       <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
         <div className="md:hidden p-2">
            <MobileNav role={role} permissions={permissions} />
         </div>
         <div className="flex-1 p-4 md:p-8 overflow-y-auto">
           {children}
         </div>
       </div>
    </div>
  )
}

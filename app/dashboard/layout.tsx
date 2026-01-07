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

  // Sync profile email if different (Self-healing)
  const { data: profile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", user.id)
    .maybeSingle()

  if (profile && profile.email !== user.email && user.email) {
    // Update profile email to match auth email
    await supabase.from("profiles").update({ email: user.email }).eq("id", user.id)
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
    <div className="flex container p-0 max-w-full h-[calc(100vh-4rem)]">
       <div className="hidden md:block h-full">
          <Sidebar role={role} permissions={permissions} />
       </div>
       <div className="flex-1 flex flex-col h-full overflow-hidden relative">
         {/* Mobile Header */}
         <div className="md:hidden p-3 border-b flex items-center gap-3 bg-background/80 backdrop-blur-md sticky top-0 z-30">
            <MobileNav role={role} permissions={permissions} />
            <span className="font-semibold text-lg">Dashboard</span>
         </div>

         <div className="flex-1 p-4 md:p-8 overflow-y-auto scroll-smooth">
           <div className="mx-auto max-w-6xl animate-in fade-in slide-in-from-bottom-4 duration-500">
             {children}
           </div>
         </div>
       </div>
    </div>
  )
}

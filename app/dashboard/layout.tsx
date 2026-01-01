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

  // Fetch role
  const { data: member } = await supabase
    .from("mess_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("status", "active")
    .eq("status", "active")
    .maybeSingle()
  
  // If no active membership (e.g., pending or no mess), sidebar might not be relevant or shows limited options
  // For now, we assume if they are in dashboard layout they might be active or pending.
  // The page.tsx handles the 'pending' state check efficiently. 
  // We can pass a default role or null if not found.
  
  const role = member?.role || "member"

  return (
    <div className="flex container p-0 max-w-full">
       <div className="hidden md:block">
          <Sidebar role={role} />
       </div>
       <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
         <div className="md:hidden p-2">
            <MobileNav role={role} />
         </div>
         <div className="flex-1 p-4 md:p-8 overflow-y-auto">
           {children}
         </div>
       </div>
    </div>
  )
}

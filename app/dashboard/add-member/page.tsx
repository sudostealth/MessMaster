import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { AddMemberForm } from "@/components/members/add-member-form"
import { PendingMemberCard } from "@/components/members/pending-member-card"

export default async function AddMemberPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: member } = await supabase
    .from("mess_members")
    .select("mess_id, role")
    .eq("user_id", user?.id)
    .single()

  const { data: mess } = await supabase
    .from("messes")
    .select("code, name")
    .eq("id", member?.mess_id)
    .single()

  const isManager = member?.role === 'manager'

  // Fetch pending members
  const { data: pendingMembers } = await supabase
    .from("mess_members")
    .select("user_id, mess_id, role, status, profiles(name, email, phone, avatar_url)")
    .eq("mess_id", member?.mess_id)
    .eq("status", "pending")
    .order("joined_at", { ascending: false })

  return (
    <div className="container py-10 space-y-8">
      <div className="max-w-2xl mx-auto space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Invite Members</CardTitle>
              <CardDescription>Share this code with new members.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
               <div className="space-y-2 text-center">
                  <Label>Mess Name</Label>
                  <div className="text-lg font-medium">{mess?.name}</div>
               </div>
               
               <div className="space-y-2">
                  <Label>Mess Code</Label>
                  <div className="flex items-center gap-2">
                     <Input value={mess?.code} readOnly className="text-center font-mono text-2xl font-bold tracking-widest bg-muted" />
                  </div>
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    Ask members to enter this code when they click "Join Mess".
                  </p>
               </div>
            </CardContent>
          </Card>

          {isManager && (
            <>
               <div className="bg-card border rounded-lg p-6 shadow-sm">
                   <h2 className="text-xl font-semibold mb-4">Add Request by Email</h2>
                   <AddMemberForm />
               </div>

               {pendingMembers && pendingMembers.length > 0 && (
                   <div className="space-y-4">
                       <h2 className="text-xl font-semibold flex items-center gap-2">
                           Pending Requests 
                           <span className="bg-yellow-500/20 text-yellow-600 text-xs px-2 py-0.5 rounded-full">{pendingMembers.length}</span>
                       </h2>
                       <div className="grid gap-4">
                           {pendingMembers.map((m: any, i: number) => (
                               <PendingMemberCard key={i} member={m} />
                           ))}
                       </div>
                   </div>
               )}
            </>
          )}
      </div>
    </div>
  )
}

import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { AddMemberForm } from "@/components/members/add-member-form"
import { CreateMemberForm } from "@/components/members/create-member-form"
import { PendingMemberCard } from "@/components/members/pending-member-card"
import { Users, Mail, Copy, UserPlus } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
    <div className="container py-8 space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col gap-2 mb-4">
          <h1 className="text-3xl font-bold tracking-tight">Manage Members</h1>
          <p className="text-muted-foreground">Invite new members or approve requests.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-8">
            <Tabs defaultValue="code" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="code">Code</TabsTrigger>
                {isManager && <TabsTrigger value="email">Email</TabsTrigger>}
                {isManager && <TabsTrigger value="create">Create</TabsTrigger>}
              </TabsList>

              <TabsContent value="code">
                <Card className="glass-card border-none shadow-lg h-fit">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      Invite via Code
                    </CardTitle>
                    <CardDescription>Share this code with new members to join.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2 text-center p-6 bg-secondary/30 rounded-xl border border-border/50">
                        <Label className="text-muted-foreground uppercase tracking-widest text-xs">Mess Name</Label>
                        <div className="text-xl font-bold text-foreground">{mess?.name}</div>
                    </div>

                    <div className="space-y-3">
                        <Label className="font-medium">Mess Code</Label>
                        <div className="relative group">
                          <Input
                              value={mess?.code}
                              readOnly
                              className="text-center font-mono text-3xl font-bold tracking-[0.2em] bg-background/50 h-16 border-2 border-primary/20 focus:border-primary/50 transition-colors"
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none opacity-50">
                              <Copy className="h-5 w-5" />
                          </div>
                        </div>
                        <p className="text-sm text-center text-muted-foreground">
                          New members can enter this code after signing up.
                        </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {isManager && (
                <TabsContent value="email">
                  <Card className="glass-card border-none shadow-lg">
                      <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                              <Mail className="h-5 w-5 text-blue-500" />
                              Invite via Email
                          </CardTitle>
                          <CardDescription>Send a direct invitation email.</CardDescription>
                      </CardHeader>
                      <CardContent>
                          <AddMemberForm />
                      </CardContent>
                  </Card>
                </TabsContent>
              )}

              {isManager && (
                 <TabsContent value="create">
                    <Card className="glass-card border-none shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <UserPlus className="h-5 w-5 text-green-500" />
                                Create Account
                            </CardTitle>
                            <CardDescription>Create a new user account for a member.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <CreateMemberForm />
                        </CardContent>
                    </Card>
                 </TabsContent>
              )}
            </Tabs>
          </div>

          {/* Right Side: Pending Requests */}
          {isManager && (
            <div className="space-y-8">
               {pendingMembers && pendingMembers.length > 0 ? (
                   <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                       <h2 className="text-xl font-semibold flex items-center gap-2">
                           Pending Requests 
                           <span className="bg-yellow-500/20 text-yellow-600 text-xs px-2.5 py-1 rounded-full border border-yellow-500/20">{pendingMembers.length}</span>
                       </h2>
                       <div className="grid gap-3">
                           {pendingMembers.map((m: any, i: number) => (
                               <PendingMemberCard key={i} member={m} />
                           ))}
                       </div>
                   </div>
               ) : (
                  <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground border rounded-xl border-dashed">
                      <Users className="h-10 w-10 mb-4 opacity-20" />
                      <h3 className="text-lg font-medium">No Pending Requests</h3>
                      <p className="text-sm">Requests from new members using the code will appear here.</p>
                  </div>
               )}
            </div>
          )}
      </div>
    </div>
  )
}

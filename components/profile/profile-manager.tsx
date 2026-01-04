"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Shield, AlertTriangle, Key, Mail, Lock, Loader2 } from "lucide-react"
import { updateProfile, updateEmail, updatePassword } from "@/app/actions/auth"
import { deleteMess, leaveMess } from "@/app/actions/mess"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export function ProfileManager({ profile, messId }: { profile: any, messId?: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [emailLoading, setEmailLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  
  const initials = profile.name ? profile.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase() : "U"

  async function handleUpdate(formData: FormData) {
      setLoading(true)
      const res = await updateProfile(formData)
      setLoading(false)
      if (res.error) toast.error(res.error)
      else toast.success("Profile updated!")
  }

  async function handleEmailUpdate(formData: FormData) {
      setEmailLoading(true)
      const email = formData.get("email") as string
      if (email === profile.email) {
          setEmailLoading(false)
          return
      }
      const res = await updateEmail(email)
      setEmailLoading(false)
      if (res.error) toast.error(res.error)
      else toast.success("Email update confirmation sent to both emails.")
  }

  async function handlePasswordUpdate(formData: FormData) {
      setPasswordLoading(true)
      const password = formData.get("password") as string
      const res = await updatePassword(password)
      setPasswordLoading(false)
      if (res.error) toast.error(res.error)
      else {
          toast.success("Password updated successfully!")
          // Optional: clear the input
          const form = document.getElementById("password-form") as HTMLFormElement
          if(form) form.reset()
      }
  }

  async function handleLeave() {
      if(confirm("Are you sure you want to leave this mess?")) {
          setLoading(true)
          const res = await leaveMess()
          if(res.error) {
              toast.error(res.error)
              setLoading(false)
          } else {
              router.push("/dashboard")
          }
      }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
       {/* Hero Section */}
       <div className="flex flex-col md:flex-row items-center gap-6 p-6 rounded-3xl glass text-center md:text-left">
          <Avatar className="h-24 w-24 ring-4 ring-white/20 shadow-2xl">
              <AvatarImage src={profile.avatar_url} />
              <AvatarFallback className="text-2xl bg-primary text-white font-bold">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
             <h1 className="text-3xl font-bold mb-1">{profile.name}</h1>
             <p className="text-muted-foreground flex items-center justify-center md:justify-start gap-2">
                <Shield className="h-4 w-4" /> {profile.role || "Member"}
             </p>
          </div>
       </div>

       <div className="grid gap-6 md:grid-cols-2">
          {/* Personal Information Form */}
          <Card className="glass-card md:col-span-2">
             <CardHeader>
                <CardTitle>Edit Profile</CardTitle>
                <CardDescription>Update your personal details.</CardDescription>
             </CardHeader>
             <CardContent>
                <form action={handleUpdate} className="space-y-4">
                   <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <Label>Full Name</Label>
                         <Input name="name" defaultValue={profile.name} required />
                      </div>
                      <div className="space-y-2">
                         <Label>Phone Number</Label>
                         <Input name="phone" defaultValue={profile.phone} />
                      </div>
                   </div>
                   <div className="flex justify-end pt-4">
                      <Button type="submit" disabled={loading}>
                          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                          Save Changes
                      </Button>
                   </div>
                </form>
             </CardContent>
          </Card>

          {/* Security Settings */}
          <Card className="glass-card md:col-span-2">
              <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                      <Key className="h-5 w-5"/> Security Settings
                  </CardTitle>
                  <CardDescription>Manage your account credentials.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                  {/* Email Update */}
                  <form action={handleEmailUpdate} className="space-y-4 pb-6 border-b">
                      <div className="space-y-2">
                          <Label>Email Address</Label>
                          <div className="flex gap-4">
                              <div className="relative flex-1">
                                <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input name="email" defaultValue={profile.email} className="pl-9" required />
                              </div>
                              <Button type="submit" variant="outline" disabled={emailLoading}>
                                  {emailLoading ? <Loader2 className="h-4 w-4 animate-spin"/> : "Update"}
                              </Button>
                          </div>
                          <p className="text-xs text-muted-foreground">Changing email requires confirmation on both new and old addresses.</p>
                      </div>
                  </form>

                  {/* Password Update */}
                  <form id="password-form" action={handlePasswordUpdate} className="space-y-4">
                      <div className="space-y-2">
                          <Label>Change Password</Label>
                          <div className="flex gap-4">
                              <div className="relative flex-1">
                                <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input name="password" type="password" placeholder="New Password" className="pl-9" required minLength={6} />
                              </div>
                              <Button type="submit" variant="outline" disabled={passwordLoading}>
                                  {passwordLoading ? <Loader2 className="h-4 w-4 animate-spin"/> : "Update"}
                              </Button>
                          </div>
                      </div>
                  </form>
              </CardContent>
          </Card>
           
          {messId && (
              <Card className="glass-card border-red-500/20 bg-red-500/5 md:col-span-2">
                 <CardHeader><CardTitle className="text-red-600 flex items-center gap-2"><AlertTriangle className="h-5 w-5"/> Danger Zone</CardTitle></CardHeader>
                 <CardContent className="space-y-4">
                    {profile.role === 'manager' ? (
                        <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-white/50 dark:bg-black/20">
                            <div>
                                <h4 className="font-semibold text-red-700">Delete Mess</h4>
                                <p className="text-sm text-red-600/80">Permanently delete this mess.</p>
                            </div>
                            <DeleteMessButton messId={messId} /> 
                        </div>
                    ) : (
                        <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-white/50 dark:bg-black/20">
                            <div>
                                <h4 className="font-semibold text-red-700">Leave Mess</h4>
                                <p className="text-sm text-red-600/80">Leave current mess.</p>
                            </div>
                            <Button variant="secondary" className="bg-red-500/10 text-red-600 hover:bg-red-500/20" onClick={handleLeave} disabled={loading}>Leave Mess</Button>
                        </div>
                    )}
                 </CardContent>
              </Card>
          )}
       </div>
    </div>
  )
}

function DeleteMessButton({ messId }: { messId?: string }) {
    // Client component for the button logic
    const handleDelete = async () => {
        if (!messId) {
            toast.error("Error: Mess ID not found");
            return;
        }
        if (confirm("Are you ABSOLUTELY sure? This action cannot be undone.")) {
            const res = await deleteMess(messId);
            if (res.error) toast.error(res.error);
        }
    }
    
    return <Button className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDelete}>Delete Mess</Button>
}

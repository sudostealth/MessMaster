"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/contexts/language-context"
import { deleteAccount } from "@/app/actions/auth"
import { Trash2, AlertTriangle, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog"
import { toast } from "sonner"

interface ProfilePageContentProps {
    profile: any;
    member: any;
}

export function ProfilePageContent({ profile, member }: ProfilePageContentProps) {
    const { t } = useLanguage()
    const router = useRouter()
    const [isDeleting, setIsDeleting] = useState(false)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    const handleDeleteAccount = async () => {
        setIsDeleting(true)
        try {
            const res = await deleteAccount()
            if (res?.error) {
                toast.error(res.error)
                setIsDeleting(false)
                setIsDialogOpen(false)
            } else {
                toast.success("Account deleted successfully")
                router.push("/login")
            }
        } catch (error) {
            toast.error("An unexpected error occurred")
            setIsDeleting(false)
            setIsDialogOpen(false)
        }
    }

    return (
        <div className="container py-8 max-w-2xl space-y-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">{t("my_profile")}</h1>
            <p className="text-muted-foreground">Manage your personal information.</p>
          </div>
          
          <Card>
            <CardHeader className="flex flex-row items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback className="text-xl">{profile?.name?.[0]}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl">{profile?.name}</CardTitle>
                <p className="text-muted-foreground">{profile?.email}</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <h4 className="font-semibold text-muted-foreground mb-1">{t("phone")}</h4>
                        <p>{profile?.phone || t("not_set")}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-muted-foreground mb-1">{t("mess")}</h4>
                        <p>{Array.isArray(member?.messes) ? member.messes[0]?.name : (member?.messes as any)?.name || t("no_mess")}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-muted-foreground mb-1">{t("role")}</h4>
                        <Badge variant="outline" className="uppercase">{member?.role || "N/A"}</Badge>
                    </div>
                    <div>
                        <h4 className="font-semibold text-muted-foreground mb-1">{t("status")}</h4>
                        <Badge variant={member?.status === 'active' ? 'default' : 'secondary'} className="uppercase">
                            {member?.status || "N/A"}
                        </Badge>
                    </div>
                </div>
            </CardContent>
          </Card>

          <Card className="border-destructive/50 bg-destructive/5">
              <CardHeader>
                  <CardTitle className="text-destructive flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Danger Zone
                  </CardTitle>
              </CardHeader>
              <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                      Deleting your account is permanent. Your data in the mess (Deposits, Expenses) will be anonymized, but your profile and membership will be removed immediately.
                  </p>

                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                      <DialogTrigger asChild>
                          <Button variant="destructive" className="w-full sm:w-auto">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Account
                          </Button>
                      </DialogTrigger>
                      <DialogContent>
                          <DialogHeader>
                              <DialogTitle>Are you absolutely sure?</DialogTitle>
                              <DialogDescription>
                                  This action cannot be undone. This will permanently delete your account and remove your data from our servers.
                              </DialogDescription>
                          </DialogHeader>
                          <DialogFooter className="gap-2 sm:gap-0">
                              <DialogClose asChild>
                                <Button variant="outline">Cancel</Button>
                              </DialogClose>
                              <Button variant="destructive" onClick={handleDeleteAccount} disabled={isDeleting}>
                                  {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : "Yes, delete my account"}
                              </Button>
                          </DialogFooter>
                      </DialogContent>
                  </Dialog>
              </CardContent>
          </Card>
        </div>
      )
}

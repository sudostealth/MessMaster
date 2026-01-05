"use client"

import { useState } from "react"
import { useFormStatus } from "react-dom"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { addBorrow } from "@/app/actions/finance"
import { toast } from "sonner"
import { ArrowDownLeft, Loader2 } from "lucide-react"
import { useEffect } from "react"
import { useLanguage } from "@/contexts/language-context"

function SubmitButton() {
  const { pending } = useFormStatus()
  const { t } = useLanguage()

  return (
    <Button type="submit" className="w-full bg-red-600 hover:bg-red-700" disabled={pending}>
      {pending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("saving")}...</> : t("confirm_borrow")}
    </Button>
  )
}

export function AddBorrowDialog({ isManager }: { isManager: boolean }) {
  const [open, setOpen] = useState(false)
  const [members, setMembers] = useState<any[]>([])
  const { t } = useLanguage()

  useEffect(() => {
      if(open) {
          const fetchMembers = async () => {
              const supabase = createClient()
              const { data: { user } } = await supabase.auth.getUser()
              if(!user) return

              const { data: myMember } = await supabase.from("mess_members").select("mess_id").eq("user_id", user.id).single()
              if(!myMember) return

              const { data } = await supabase
                  .from("mess_members")
                  .select("user_id, profiles(name)")
                  .eq("mess_id", myMember.mess_id)
                  .eq("status", "active")

              setMembers(data || [])
          }
          fetchMembers()
      }
  }, [open])

  async function clientAction(formData: FormData) {
      const res = await addBorrow(formData)
      if (res?.error) {
          toast.error(res.error)
      } else {
          toast.success("Borrow recorded successfully")
          setOpen(false)
      }
  }

  if (!isManager) return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 border-red-200 hover:bg-red-50 text-red-600">
            <ArrowDownLeft className="h-4 w-4" />
            {t("borrow_money") || "Borrow Money"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("borrow_money") || "Borrow Money"}</DialogTitle>
          <DialogDescription>
            {t("borrow_description") || "Record money borrowed by a member from the mess fund."}
          </DialogDescription>
        </DialogHeader>
        <form action={clientAction} className="space-y-4 pt-4">
            <div className="grid gap-2">
                <Label htmlFor="memberId">{t("member")}</Label>
                <Select name="memberId" required>
                    <SelectTrigger>
                        <SelectValue placeholder={t("select_member")} />
                    </SelectTrigger>
                    <SelectContent>
                        {members.map((m) => (
                            <SelectItem key={m.user_id} value={m.user_id}>
                                {m.profiles?.name || "Unknown"}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="grid gap-2">
                <Label htmlFor="amount">{t("amount")}</Label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">৳</span>
                    <Input id="amount" name="amount" type="number" step="0.01" min="0" required className="pl-8" placeholder="0.00" />
                </div>
            </div>

            <div className="grid gap-2">
                <Label htmlFor="date">{t("date")}</Label>
                <Input id="date" name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="details">{t("details_optional")}</Label>
                <Textarea id="details" name="details" placeholder={t("details_placeholder") || "Reason for borrowing..."} />
            </div>

            <SubmitButton />
        </form>
      </DialogContent>
    </Dialog>
  )
}

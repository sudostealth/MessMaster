"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Loader2, Shield } from "lucide-react"
import { updateMemberPermissions, transferManagership } from "@/app/actions/members"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface PermissionDialogProps {
  member: {
      user_id: string
      role: string
      name: string
      email: string
      can_manage_meals: boolean
      can_manage_finance: boolean
      can_manage_members: boolean
  }
  isManager: boolean
  currentUserId: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function PermissionDialog({ member, isManager, currentUserId, open: controlledOpen, onOpenChange }: PermissionDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = isControlled ? onOpenChange! : setInternalOpen
  
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  
  // Permissions State
  const [perms, setPerms] = useState({
      can_manage_meals: member.can_manage_meals || false,
      can_manage_finance: member.can_manage_finance || false,
      can_manage_members: member.can_manage_members || false
  })

  // Only managers can edit permissions of others
  if (!isManager || member.user_id === currentUserId) return null

  const handleSave = async () => {
      setLoading(true)
      const res = await updateMemberPermissions(member.user_id, perms)
      setLoading(false)
      
      if (res.error) {
          toast.error(res.error)
      } else {
          toast.success("Permissions updated")
          setOpen(false)
          router.refresh()
      }
  }

  const handleTransfer = async () => {
      if (!confirm("Are you sure you want to transfer managership? You will lose manager privileges immediately.")) return
      setLoading(true)
      const res = await transferManagership(member.user_id)
      setLoading(false)
      if (res.error) {
          toast.error(res.error)
      } else {
          toast.success("Managership transferred")
          setOpen(false)
          router.push("/dashboard") // Redirect as permissions changed
          router.refresh()
      }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
                <Shield className="h-4 w-4" />
            </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Manage Permissions</DialogTitle>
          <DialogDescription>
            Configure access for {member.name}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="meals">Manage Meals</Label>
            <Switch 
                id="meals" 
                checked={perms.can_manage_meals}
                onCheckedChange={(c: boolean) => setPerms({...perms, can_manage_meals: c})}
            />
          </div>
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="finance">Manage Finance</Label>
            <Switch 
                id="finance" 
                checked={perms.can_manage_finance}
                onCheckedChange={(c: boolean) => setPerms({...perms, can_manage_finance: c})}
            />
          </div>
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="members">Manage Members (Add/Remove)</Label>
            <Switch 
                id="members" 
                checked={perms.can_manage_members}
                onCheckedChange={(c: boolean) => setPerms({...perms, can_manage_members: c})}
            />
          </div>
          
          <div className="pt-4 border-t mt-2">
              <Button variant="destructive" className="w-full" onClick={handleTransfer} disabled={loading}>
                  Transfer Managership to {member.name}
              </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

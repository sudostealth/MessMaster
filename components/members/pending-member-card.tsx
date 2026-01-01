"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Check, X, Shield } from "lucide-react"
import { approveMember, rejectMember } from "@/app/actions/mess"
import { useState } from "react"

interface PendingMemberCardProps {
  member: {
    user_id: string
    mess_id: string
    profiles: {
      name: string
      email: string
      avatar_url?: string
    }
  }
}

export function PendingMemberCard({ member }: PendingMemberCardProps) {
  const { profiles, user_id, mess_id } = member
  const initials = profiles.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()
  const [loading, setLoading] = useState(false)

  const handleApprove = async () => {
    setLoading(true)
    await approveMember(user_id, mess_id)
    setLoading(false)
  }

  const handleReject = async () => {
      if (confirm("Reject this user?")) {
        setLoading(true)
        await rejectMember(user_id, mess_id)
        setLoading(false)
      }
  }

  return (
    <Card className="glass-card overflow-hidden border-yellow-500/20 bg-yellow-500/5">
       <CardContent className="flex items-center justify-between p-4 gap-4">
          <div className="flex items-center gap-3 min-w-0">
              <Avatar className="h-10 w-10 flex-shrink-0">
                 <AvatarImage src={profiles.avatar_url} />
                 <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                  <h4 className="font-bold text-sm truncate">{profiles.name}</h4>
                  <p className="text-xs text-muted-foreground truncate">{profiles.email}</p>
              </div>
          </div>
          
          <div className="flex gap-2 flex-shrink-0">
             <Button size="icon" variant="outline" className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={handleReject} disabled={loading}>
                <X className="h-4 w-4" />
             </Button>
             <Button size="icon" variant="default" className="h-8 w-8 bg-green-600 hover:bg-green-700 text-white" onClick={handleApprove} disabled={loading}>
                <Check className="h-4 w-4" />
             </Button>
          </div>
       </CardContent>
    </Card>
  )
}

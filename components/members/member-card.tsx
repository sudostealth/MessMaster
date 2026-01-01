"use client"

import { useState } from "react"
import { useLanguage } from "@/contexts/language-context"

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { removeMember } from "@/app/actions/mess"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Phone, Mail, Shield } from "lucide-react"
import { PermissionDialog } from "./permission-dialog"

// ... inside component ...
export function MemberCard({ member, isManager, currentUserId }: { member: any, isManager?: boolean, currentUserId?: string }) {
  const router = useRouter()
  const { t } = useLanguage()
  const [showPerms, setShowPerms] = useState(false)
  // ... existing destructuring ...
  const { role, status, profiles, user_id } = member
  const isSelf = currentUserId === user_id
  const initials = profiles.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()

  async function handleRemove() {
      if(confirm(`${t("are_you_sure_remove")} ${profiles.name}?`)) {
          const res = await removeMember(user_id)
          if(res.error) alert(res.error)
          else {
              alert(t("member_removed"))
              router.refresh()
          }
      }
  }

  return (
    <Card className="glass-card overflow-hidden hover:scale-[1.02] transition-transform duration-300">
       <CardHeader className="flex flex-row items-start justify-between pb-2">
          {/* ... existing badge ... */}
          <Badge variant={status === "active" ? "default" : "secondary"} className="uppercase text-[10px]">
             {status}
          </Badge>
          
          {isManager && (
              <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 -mt-2">
                         <MoreHorizontal className="h-4 w-4" />
                      </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                      {isManager && currentUserId && !isSelf && (
                          <DropdownMenuItem onClick={() => setShowPerms(true)}>
                              {t("manage_access_transfer")}
                          </DropdownMenuItem>
                      )}
                      {!isSelf && (
                          <DropdownMenuItem className="text-red-600 focus:text-red-700" onClick={handleRemove}>
                              {t("remove")} {t("members").slice(0, -1)}
                          </DropdownMenuItem>
                      )}
                  </DropdownMenuContent>
              </DropdownMenu>
          )}
       </CardHeader>
       {/* ... rest of content ... */}
       <CardContent className="text-center pt-0 pb-6">
          <div className="mb-4 flex justify-center">
             <Avatar className="h-20 w-20 ring-4 ring-background shadow-xl">
                <AvatarImage src={profiles.avatar_url} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-white text-xl font-bold">
                   {initials}
                </AvatarFallback>
             </Avatar>
          </div>
          
          <h3 className="font-bold text-lg leading-tight mb-1">{profiles.name}</h3>
          <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-4 font-medium uppercase tracking-wider">
             <Shield className="h-3 w-3" /> {role}
          </div>

          <div className="flex justify-center gap-2">
             <Button variant="outline" size="sm" className="h-8 w-8 rounded-full p-0">
                <Phone className="h-3 w-3" />
             </Button>
             <Button variant="outline" size="sm" className="h-8 w-8 rounded-full p-0">
                <Mail className="h-3 w-3" />
             </Button>
             
             {isManager && currentUserId && (
                 <PermissionDialog 
                     open={showPerms}
                     onOpenChange={setShowPerms}
                     member={{
                         ...member,
                         name: member.profiles?.name || "Unknown",
                         email: member.profiles?.email || ""
                     }} 
                     isManager={isManager} 
                     currentUserId={currentUserId} 
                 />
             )}
          </div>
       </CardContent>
    </Card>
  )
}

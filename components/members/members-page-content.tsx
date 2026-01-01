"use client"

import { MemberCard } from "@/components/members/member-card"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

interface MembersPageContentProps {
    allMembers: any[];
    myMembership: any;
    user: any;
}

export function MembersPageContent({ allMembers, myMembership, user }: MembersPageContentProps) {
  const { t } = useLanguage()

  if (!myMembership) return <div className="p-8 text-center">{t("join_mess_to_see_members")}</div>

  const isManager = myMembership.role === 'manager'

  return (
    <div className="container py-8 space-y-8">
       <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gradient">{t("members")}</h1>
            <p className="text-muted-foreground">{allMembers?.length || 0} {t("active").toLowerCase()} {t("members").toLowerCase()}</p>
          </div>
          <div className="relative w-full md:w-[300px]">
             <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
             <Input placeholder={t("search_members")} className="pl-10 glass" />
          </div>
       </div>

       <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
           {allMembers?.map((m: any, i: number) => (
               <MemberCard key={i} member={m} isManager={isManager} currentUserId={user?.id} />
           ))}
       </div>
    </div>
  )
}

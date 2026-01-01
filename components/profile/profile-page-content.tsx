"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/contexts/language-context"

interface ProfilePageContentProps {
    profile: any;
    member: any;
}

export function ProfilePageContent({ profile, member }: ProfilePageContentProps) {
    const { t } = useLanguage()

    return (
        <div className="container py-8 max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight mb-8">{t("my_profile")}</h1>
          
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
        </div>
      )
}

"use client"

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/contexts/language-context'
import { UserNav } from "@/components/layout/user-nav"
import { ThemeToggle as ModeToggle } from "@/components/ui/theme-toggle"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { NotificationPanel } from "./notification-panel"
import { LanguageToggle } from "@/components/layout/language-toggle"

export function Header() {
  const { t } = useLanguage()
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
       const { data: { user } } = await supabase.auth.getUser()
       setUser(user)
    }
    getUser()
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])
  
  return (
    <header className="border-b bg-background/95 backdrop-blur z-50 sticky top-0">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-2xl tracking-tight">
          <span className="text-gradient">MessMaster</span>
        </div>
        
        <div className="flex items-center gap-4">
          <LanguageToggle />
          <ModeToggle />
          {user ? (
            <>
              <NotificationPanel />
              <UserNav />
            </>
          ) : (
             <a href="/login" className="text-sm font-medium hover:text-primary transition-colors">
               {t("login")}
             </a>
          )}
        </div>
      </div>
    </header>
  )
}

"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  Utensils, 
  Wallet, 
  Users, 
  AlertCircle, 
  Settings, 
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  LogOut
} from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { signOut } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/contexts/language-context"

export function Sidebar({ role, isMobile = false }: { role: string, isMobile?: boolean }) {
  const { t } = useLanguage()
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const isManager = role === "manager" || role === "admin"

  const links = [
    { href: "/dashboard", label: t("overview"), icon: LayoutDashboard },
    { href: "/dashboard/meals", label: t("meals"), icon: Utensils },
    { href: "/dashboard/finance", label: t("finance"), icon: Wallet },
    { href: "/dashboard/members", label: t("members"), icon: Users },
    { href: "/dashboard/updates", label: t("updates"), icon: AlertCircle },
  ]

  const managerLinks = [
    { href: "/dashboard/add-meal", label: t("add_meal"), icon: PlusCircle },
    { href: "/dashboard/add-cost", label: t("add_cost"), icon: PlusCircle },
    { href: "/dashboard/add-deposit", label: t("add_deposit"), icon: PlusCircle },
    { href: "/dashboard/add-member", label: t("add_member"), icon: PlusCircle },
  ]

  const toggleSidebar = () => setIsCollapsed(!isCollapsed)

  const NavItem = ({ href, label, icon: Icon }: { href: string; label: string; icon: any }) => {
    const isActive = pathname === href
    return (
      <Link
        href={href}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
          isActive 
            ? "bg-primary/10 text-primary" 
            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
          isCollapsed && "justify-center px-2"
        )}
      >
        <Icon className={cn("h-5 w-5 shrink-0", isActive && "fill-current/20")} />
        
        <AnimatePresence>
          {!isCollapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="whites-nowrap overflow-hidden text-sm font-medium"
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>

        {isCollapsed && (
          <div className="absolute left-full ml-2 rounded-md bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md opacity-0 group-hover:opacity-100 pointer-events-none z-50 whitespace-nowrap">
            {label}
          </div>
        )}
      </Link>
    )
  }

  return (
    <motion.aside 
      initial={false}
      animate={{ width: isMobile ? "100%" : (isCollapsed ? "80px" : "280px") }}
      className={cn(
        "flex flex-col h-full bg-background transition-[width] duration-300 ease-in-out",
        !isMobile && "hidden md:flex sticky top-16 border-r glass-panel z-40 h-[calc(100vh-4rem)]",
        isMobile && "w-full"
      )}
    >
      {!isMobile && (
        <div className="flex items-center justify-end p-2 border-b border-border/50">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleSidebar}
            className="h-8 w-8 rounded-full hover:bg-muted"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      )}

      <div className="flex-1 flex flex-col gap-2 p-3 overflow-y-auto overflow-x-hidden scrollbar-none">
        <div className={cn("text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider px-3", isCollapsed && "text-center")}>
          {isCollapsed ? "Menu" : t("main_menu")}
        </div>
        
        {links.map((link) => (
          <NavItem key={link.href} {...link} />
        ))}

        {isManager && (
          <>
            <div className={cn("text-xs font-semibold text-muted-foreground mt-4 mb-1 uppercase tracking-wider px-3", isCollapsed && "text-center")}>
              {isCollapsed ? "Mng" : t("management")}
            </div>
            {managerLinks.map((link) => (
              <NavItem key={link.href} {...link} />
            ))}
          </>
        )}
      </div>

      <div className="p-3 border-t border-border/50 mt-auto flex flex-col gap-2">
        <NavItem href="/dashboard/settings" label={t("settings")} icon={Settings} />
        <form action={signOut}>
            <button className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group text-red-500 hover:bg-red-500/10",
                  isCollapsed && "justify-center px-2"
                )}>
                 <LogOut className="h-5 w-5 shrink-0" />
                 <AnimatePresence>
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      className="whites-nowrap overflow-hidden text-sm font-medium"
                    >
                      {t("logout")}
                    </motion.span>
                  )}
                </AnimatePresence>
            </button>
        </form>
      </div>
    </motion.aside>
  )
}

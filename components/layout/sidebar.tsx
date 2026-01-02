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

interface SidebarProps {
    role: string;
    permissions?: {
        can_manage_meals: boolean;
        can_manage_finance: boolean;
        can_manage_members: boolean;
    };
    isMobile?: boolean;
}

export function Sidebar({ role, permissions, isMobile = false }: SidebarProps) {
  const { t } = useLanguage()
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const isManager = role === "manager" || role === "admin"

  const links = [
    { href: "/dashboard", label: t("overview"), icon: LayoutDashboard },
    { href: "/dashboard/meals", label: t("meals"), icon: Utensils },
    { href: "/dashboard/finance", label: t("finance"), icon: Wallet },
    { href: "/dashboard/members", label: t("members"), icon: Users },
  ]

  // Construct management links based on permissions
  const managementLinks = []

  if (isManager || permissions?.can_manage_meals) {
      managementLinks.push({ href: "/dashboard/add-meal", label: t("add_meal"), icon: PlusCircle })
  }

  if (isManager || permissions?.can_manage_finance) {
      managementLinks.push({ href: "/dashboard/add-cost", label: t("add_cost"), icon: PlusCircle })
      managementLinks.push({ href: "/dashboard/add-deposit", label: t("add_deposit"), icon: PlusCircle })
  }

  if (isManager || permissions?.can_manage_members) {
      managementLinks.push({ href: "/dashboard/add-member", label: t("add_member"), icon: PlusCircle })
  }

  const toggleSidebar = () => setIsCollapsed(!isCollapsed)

  const NavItem = ({ href, label, icon: Icon }: { href: string; label: string; icon: any }) => {
    const isActive = pathname === href
    return (
      <Link
        href={href}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group relative",
          isActive 
            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
            : "text-muted-foreground hover:bg-secondary hover:text-foreground",
          isCollapsed && "justify-center px-2"
        )}
      >
        <Icon className={cn("h-5 w-5 shrink-0 transition-transform duration-300", isActive ? "scale-105" : "group-hover:scale-110")} />
        
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="whitespace-nowrap overflow-hidden text-sm font-medium"
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>

        {isCollapsed && (
          <div className="absolute left-[110%] top-1/2 -translate-y-1/2 ml-2 rounded-md bg-popover px-3 py-1.5 text-xs font-medium text-popover-foreground shadow-xl border border-border/50 opacity-0 group-hover:opacity-100 pointer-events-none z-50 whitespace-nowrap transition-opacity duration-200">
            {label}
            <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 border-4 border-transparent border-r-popover"></div>
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
        "flex flex-col h-full bg-background/50 backdrop-blur-xl transition-[width] duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]",
        !isMobile && "hidden md:flex sticky top-16 border-r border-border/50 z-40 h-[calc(100vh-4rem)] shadow-sm",
        isMobile && "w-full"
      )}
    >
      {!isMobile && (
        <div className="flex items-center justify-end p-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleSidebar}
            className="h-8 w-8 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      )}

      <div className="flex-1 flex flex-col gap-2 p-3 overflow-y-auto overflow-x-hidden scrollbar-none">
        <div className={cn("text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider px-3 transition-all duration-300", isCollapsed && "text-center scale-90")}>
          {isCollapsed ? "Menu" : t("main_menu")}
        </div>
        
        <div className="flex flex-col gap-1">
          {links.map((link) => (
            <NavItem key={link.href} {...link} />
          ))}
        </div>

        {managementLinks.length > 0 && (
          <>
            <div className={cn("text-xs font-semibold text-muted-foreground mt-6 mb-2 uppercase tracking-wider px-3 transition-all duration-300", isCollapsed && "text-center scale-90")}>
              {isCollapsed ? "Mng" : t("management")}
            </div>
            <div className="flex flex-col gap-1">
              {managementLinks.map((link) => (
                <NavItem key={link.href} {...link} />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="p-3 border-t border-border/50 mt-auto flex flex-col gap-1 bg-background/30">
        <NavItem href="/dashboard/settings" label={t("settings")} icon={Settings} />
        <form action={signOut}>
            <button className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group text-destructive hover:bg-destructive/10 hover:text-destructive",
                  isCollapsed && "justify-center px-2"
                )}>
                 <LogOut className="h-5 w-5 shrink-0 transition-transform group-hover:translate-x-1" />
                 <AnimatePresence mode="wait">
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className="whitespace-nowrap overflow-hidden text-sm font-medium"
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

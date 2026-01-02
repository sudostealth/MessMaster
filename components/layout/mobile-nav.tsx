"use client"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { Menu } from "lucide-react"
import { Sidebar } from "@/components/layout/sidebar"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"

interface MobileNavProps {
    role: string;
    permissions?: {
        can_manage_meals: boolean;
        can_manage_finance: boolean;
        can_manage_members: boolean;
    };
}

export function MobileNav({ role, permissions }: MobileNavProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden lg:hidden top-4 left-4 z-50">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 border-r w-[280px]">
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        <div className="h-full py-0">
            <Sidebar role={role} permissions={permissions} isMobile={true} />
        </div>
      </SheetContent>
    </Sheet>
  )
}

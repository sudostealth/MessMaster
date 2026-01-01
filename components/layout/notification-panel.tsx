"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { createClient } from "@/lib/supabase/client"
import { ScrollArea } from "@/components/ui/scroll-area"

export function NotificationPanel() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchNotifications()

    // Subscribe to new notifications
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
             // In real app we check if it's for this user, but RLS might filter? 
             // Client listener receives all broadcasts if not filtered.
             // But for private notifications we rely on fetching or specific channel.
             // Simple fallback: just refetch.
             fetchNotifications()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchNotifications = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20)
      
      if (data) {
          setNotifications(data)
          setUnreadCount(data.filter(n => !n.is_read).length)
      }
  }

  const markAsRead = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      // Optimistic update
      setUnreadCount(0)
      setNotifications(notifications.map(n => ({ ...n, is_read: true })))

      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false)
  }

  return (
    <Sheet open={open} onOpenChange={(val) => {
        setOpen(val)
        if (val) markAsRead()
    }}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-red-600 animate-pulse border border-background" />
          )}
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Notifications</SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-100px)] mt-4 pr-4">
             {notifications.length === 0 ? (
                 <p className="text-center text-muted-foreground py-8">No notifications</p>
             ) : (
                 <div className="space-y-4">
                     {notifications.map((n) => (
                         <div key={n.id} className={`p-3 rounded-lg border ${n.is_read ? 'bg-background' : 'bg-muted/30 border-primary/20'}`}>
                             <h4 className="font-semibold text-sm mb-1">{n.title}</h4>
                             <p className="text-sm text-muted-foreground">{n.message}</p>
                             <p className="text-[10px] text-muted-foreground mt-2 text-right">
                                 {new Date(n.created_at).toLocaleDateString()} {new Date(n.created_at).toLocaleTimeString()}
                             </p>
                         </div>
                     ))}
                 </div>
             )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

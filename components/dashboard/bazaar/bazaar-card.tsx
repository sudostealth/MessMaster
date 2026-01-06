"use client"

import { completeSchedule, deleteSchedule } from "@/app/actions/bazaar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { Check, Calendar as CalendarIcon, ShoppingCart, User, Trash2 } from "lucide-react"
import { format, isSameDay, parseISO } from "date-fns"
import { useState } from "react"
import { toast } from "sonner"
import { motion } from "framer-motion"

interface BazaarCardProps {
    schedules: any[]
    currentUserId: string
    isManager: boolean
}

export function BazaarCard({ schedules, currentUserId, isManager }: BazaarCardProps) {
    const [loadingId, setLoadingId] = useState<string | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const handleComplete = async (id: string) => {
        setLoadingId(id)
        try {
            const res = await completeSchedule(id)
            if (res.error) {
                toast.error(res.error)
            } else {
                toast.success("Marked as done!")
            }
        } catch (error) {
            toast.error("Failed to update")
        } finally {
            setLoadingId(null)
        }
    }

    const handleDelete = async (id: string) => {
        setDeletingId(id)
        try {
            const res = await deleteSchedule(id)
            if (res.error) {
                toast.error(res.error)
            } else {
                toast.success("Schedule deleted")
            }
        } catch (error) {
            toast.error("Failed to delete")
        } finally {
            setDeletingId(null)
        }
    }

    if (!schedules || schedules.length === 0) {
        return (
            <Card className="h-full">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5 text-primary" />
                        Upcoming Bazaar
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground text-sm">No schedules found.</p>
                </CardContent>
            </Card>
        )
    }

    // Filter to show only pending or recently completed? Or all?
    // Let's show upcoming (pending) and maybe today's completed.
    // Actually, "Upcoming Shoppers" usually implies future + today.
    // We sort by date.

    const today = new Date()
    // Filter out past completed? Or keep them for history?
    // Let's show all for the month but scroll to today?
    // Or just show pending + today.
    const displaySchedules = schedules.filter(s =>
        s.status === 'pending' || isSameDay(parseISO(s.date), today)
    )

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-primary" />
                    Upcoming Bazaar
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-[300px]">
                <ScrollArea className="h-[400px] pr-4 pb-4">
                    <div className="space-y-4">
                        {displaySchedules.map((schedule) => {
                            const date = parseISO(schedule.date)
                            const isToday = isSameDay(date, today)
                            const isShopper = schedule.shoppers.some((s: any) => s.user_id === currentUserId)
                            const canComplete = (isManager || isShopper) && schedule.status === 'pending'

                            return (
                                <motion.div
                                    key={schedule.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={cn(
                                        "relative p-4 rounded-xl border transition-all duration-300",
                                        isToday
                                          ? "bg-primary/5 border-primary/50 shadow-[0_0_15px_rgba(124,58,237,0.15)] ring-1 ring-primary/20"
                                          : "bg-card border-border hover:border-primary/20",
                                        schedule.status === 'completed' && "opacity-60 bg-muted/50"
                                    )}
                                >
                                    {/* Glassmorphism highlight for today */}
                                    {isToday && (
                                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/10 via-transparent to-transparent pointer-events-none" />
                                    )}

                                    <div className="flex justify-between items-start mb-3 relative z-10">
                                        <div className="flex items-center gap-2">
                                            <div className={cn(
                                                "p-2 rounded-lg",
                                                isToday ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                            )}>
                                                <CalendarIcon className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-sm">
                                                    {format(date, "EEEE")}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {format(date, "MMM d, yyyy")}
                                                </p>
                                            </div>
                                        </div>
                                        {schedule.status === 'completed' ? (
                                            <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100">
                                                Done
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className={cn(isToday && "border-primary text-primary")}>
                                                {isToday ? "Today" : "Upcoming"}
                                            </Badge>
                                        )}
                                    </div>

                                    <div className="space-y-2 relative z-10">
                                        <div className="flex flex-wrap gap-2">
                                            {schedule.shoppers.map((shopper: any) => (
                                                <div key={shopper.id} className="flex items-center gap-1.5 text-sm bg-background/80 backdrop-blur-sm border px-2 py-1 rounded-md">
                                                    <User className="w-3 h-3 text-muted-foreground" />
                                                    <span className="font-medium truncate max-w-[100px]">
                                                        {shopper.profile?.name || "Member"}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>

                                        {schedule.shopping_list && (
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="link" size="sm" className="h-auto p-0 text-xs text-muted-foreground hover:text-primary">
                                                        View List
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>Shopping List</DialogTitle>
                                                    </DialogHeader>
                                                    <div className="bg-muted p-4 rounded-md whitespace-pre-wrap text-sm">
                                                        {schedule.shopping_list}
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                        )}
                                    </div>

                                    <div className="mt-4 flex justify-between items-center relative z-10">
                                        <div>
                                            {isManager && (
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent>
                                                        <DialogHeader>
                                                            <DialogTitle>Delete Schedule?</DialogTitle>
                                                            <DialogDescription>
                                                                This action cannot be undone. This will remove the shopping schedule for {format(date, "MMM d")}.
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                        <div className="flex justify-end gap-2 mt-4">
                                                            <Button
                                                                variant="destructive"
                                                                onClick={() => handleDelete(schedule.id)}
                                                                disabled={deletingId === schedule.id}
                                                            >
                                                                {deletingId === schedule.id ? "Deleting..." : "Delete"}
                                                            </Button>
                                                        </div>
                                                    </DialogContent>
                                                </Dialog>
                                            )}
                                        </div>

                                        {canComplete && (
                                            <Button
                                                size="sm"
                                                onClick={() => handleComplete(schedule.id)}
                                                disabled={!!loadingId}
                                                className={cn(isToday ? "bg-primary hover:bg-primary/90" : "")}
                                            >
                                                {loadingId === schedule.id ? (
                                                    "Updating..."
                                                ) : (
                                                    <>
                                                        <Check className="w-3 h-3 mr-1" />
                                                        Mark Done
                                                    </>
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    )
}

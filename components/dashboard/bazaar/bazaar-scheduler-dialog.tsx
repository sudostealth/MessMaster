"use client"

import { useState } from "react"
import { useLanguage } from "@/contexts/language-context"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { Calendar } from "@/components/ui/calendar" // Removed since we are using input type="date"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Loader2, Plus, ShoppingCart } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { createManualSchedule, generateAutoSchedule } from "@/app/actions/bazaar"

interface BazaarSchedulerDialogProps {
    monthId: string
    members: any[] // User profiles/members
}

export function BazaarSchedulerDialog({ monthId, members }: BazaarSchedulerDialogProps) {
    const { t } = useLanguage()
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    // Manual State
    const [manualDate, setManualDate] = useState<Date | undefined>(new Date())
    const [manualMembers, setManualMembers] = useState<string[]>([])
    const [manualList, setManualList] = useState("")

    // Auto State
    const [startDate, setStartDate] = useState<Date | undefined>(new Date())
    const [frequency, setFrequency] = useState("2")
    const [totalTrips, setTotalTrips] = useState("4")
    const [membersPerTrip, setMembersPerTrip] = useState("1")

    const handleManualSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!manualDate || manualMembers.length === 0) {
            toast.error("Please select a date and at least one member")
            return
        }

        setIsLoading(true)
        try {
            const res = await createManualSchedule(monthId, manualDate, manualMembers, manualList)
            if (res.error) {
                toast.error(res.error)
            } else {
                toast.success("Schedule created successfully")
                setOpen(false)
                // Reset form?
            }
        } catch (error) {
            toast.error("An error occurred")
        } finally {
            setIsLoading(false)
        }
    }

    const handleAutoSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!startDate) {
            toast.error("Please select a start date")
            return
        }

        setIsLoading(true)
        try {
            const res = await generateAutoSchedule(
                monthId,
                startDate,
                parseInt(frequency),
                parseInt(totalTrips),
                parseInt(membersPerTrip)
            )
            if (res.error) {
                toast.error(res.error)
            } else {
                toast.success("Schedule generated successfully")
                setOpen(false)
            }
        } catch (error) {
            toast.error("An error occurred")
        } finally {
            setIsLoading(false)
        }
    }

    const toggleMember = (userId: string) => {
        setManualMembers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        )
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <ShoppingCart className="w-4 h-4" />
                    Manage Bazaar
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Bazaar Scheduler</DialogTitle>
                    <DialogDescription>
                        Set up shopping schedules manually or generate them automatically.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="manual" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="manual">Manual</TabsTrigger>
                        <TabsTrigger value="auto">Automatic</TabsTrigger>
                    </TabsList>

                    {/* MANUAL TAB */}
                    <TabsContent value="manual" className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !manualDate && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {manualDate ? format(manualDate, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <div className="p-3 border-b border-border">
                                         <input
                                           type="date"
                                           className="w-full p-2 border rounded"
                                           onChange={(e) => setManualDate(e.target.valueAsDate || undefined)}
                                           value={manualDate ? format(manualDate, "yyyy-MM-dd") : ""}
                                         />
                                    </div>
                                    {/* Or use the Calendar component if properly set up, but simple date input is safer for touch targets sometimes. Let's stick to simple input inside popover for now or just Calendar if it works */}
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-2">
                            <Label>Shoppers</Label>
                            <div className="border rounded-md p-2 space-y-2 max-h-40 overflow-y-auto">
                                {members.map((member) => (
                                    <div key={member.id} className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            id={`member-${member.id}`}
                                            checked={manualMembers.includes(member.user_id)}
                                            onChange={() => toggleMember(member.user_id)}
                                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                        />
                                        <label htmlFor={`member-${member.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                            {member.profiles?.name || member.user?.email}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Shopping List (Optional)</Label>
                            <Textarea
                                placeholder="Enter items..."
                                value={manualList}
                                onChange={(e) => setManualList(e.target.value)}
                            />
                        </div>

                        <Button onClick={handleManualSubmit} disabled={isLoading} className="w-full">
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Schedule
                        </Button>
                    </TabsContent>

                    {/* AUTO TAB */}
                    <TabsContent value="auto" className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Start Date</Label>
                             <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !startDate && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                   <div className="p-3">
                                      <input
                                           type="date"
                                           className="w-full p-2 border rounded"
                                           onChange={(e) => setStartDate(e.target.valueAsDate || undefined)}
                                           value={startDate ? format(startDate, "yyyy-MM-dd") : ""}
                                         />
                                   </div>
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Frequency (Days)</Label>
                                <Input
                                    type="number"
                                    min="1"
                                    value={frequency}
                                    onChange={(e) => setFrequency(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Total Trips</Label>
                                <Input
                                    type="number"
                                    min="1"
                                    value={totalTrips}
                                    onChange={(e) => setTotalTrips(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Members per Trip</Label>
                            <Input
                                type="number"
                                min="1"
                                value={membersPerTrip}
                                onChange={(e) => setMembersPerTrip(e.target.value)}
                            />
                        </div>

                        <div className="bg-yellow-50 text-yellow-800 p-3 rounded-md text-sm">
                            Warning: This will delete all future schedules for this month starting from the selected Start Date.
                        </div>

                        <Button onClick={handleAutoSubmit} disabled={isLoading} className="w-full">
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Generate Schedules
                        </Button>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}

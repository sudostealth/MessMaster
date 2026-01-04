"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createMemberAccount } from "@/app/actions/member"
import { UserPlus, Loader2 } from "lucide-react"
import { toast } from "sonner"

export function CreateMemberForm() {
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        const formData = new FormData(e.currentTarget)
        const res = await createMemberAccount(formData)
        setLoading(false)

        if(res.error) {
            toast.error(res.error)
        } else {
            toast.success("Member account created and added to mess!")
            e.currentTarget.reset()
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="create-name">Full Name</Label>
                    <Input id="create-name" name="name" placeholder="John Doe" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="create-phone">Phone Number</Label>
                    <Input id="create-phone" name="phone" placeholder="017..." required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="create-email">Email Address</Label>
                    <Input id="create-email" name="email" type="email" placeholder="john@example.com" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="create-password">Password</Label>
                    <Input id="create-password" name="password" type="password" placeholder="••••••••" required />
                </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full md:w-auto">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <UserPlus className="mr-2 h-4 w-4" />}
                Create Account
            </Button>
        </form>
    )
}

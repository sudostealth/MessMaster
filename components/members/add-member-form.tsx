"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { addMemberByEmail } from "@/app/actions/mess"
import { UserPlus } from "lucide-react"

export function AddMemberForm() {
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        const formData = new FormData(e.currentTarget)
        const res = await addMemberByEmail(formData)
        setLoading(false)
        
        if(res.error) {
            alert(res.error)
        } else {
            alert("Member added successfully!")
            e.currentTarget.reset()
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-lg">
            <Input name="email" type="email" placeholder="Enter user email address" required className="flex-1" />
            <Button type="submit" disabled={loading}>
                <UserPlus className="h-4 w-4 mr-2" />
                {loading ? "Adding..." : "Add Member"}
            </Button>
        </form>
    )
}

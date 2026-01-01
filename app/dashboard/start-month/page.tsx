"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { startNewMonth } from "@/app/actions/month"

export default function StartMonthPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    const result = await startNewMonth(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else {
        router.push("/dashboard")
    }
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="max-w-md mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Start New Month</CardTitle>
          <CardDescription>Begin a new accounting period for your mess.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="month-name">Month Name</Label>
              <Input id="month-name" name="name" placeholder="e.g. January 2024" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input id="start-date" name="startDate" type="date" defaultValue={today} required />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Starting..." : "Start Month"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

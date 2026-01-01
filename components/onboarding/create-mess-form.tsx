"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { createMess } from "@/app/actions/mess"
import { useLanguage } from "@/contexts/language-context"
import { useRouter } from "next/navigation"

export function CreateMessForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { t } = useLanguage()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    const result = await createMess(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else {
        router.push("/dashboard")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create a New Mess</CardTitle>
        <CardDescription>Start your own mess and become the manager</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="create-name">Mess Name</Label>
            <Input id="create-name" name="name" placeholder="e.g. Bachelor Point" required />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Mess"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

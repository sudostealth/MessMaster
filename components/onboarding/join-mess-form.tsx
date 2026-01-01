"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { joinMess, searchMess } from "@/app/actions/mess"
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react"

export function JoinMessForm() {
  const [step, setStep] = useState<'search' | 'confirm'>('search')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [messDetails, setMessDetails] = useState<any>(null)
  const [searchCode, setSearchCode] = useState<string>("")
  
  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    
    const formData = new FormData(e.currentTarget)
    const code = formData.get("code") as string
    setSearchCode(code) // Persist code
    
    // Call search action
    const result = await searchMess(code)
    
    if (result.error || !result.mess) {
       setMessage({ type: 'error', text: result.error || "Mess not found" })
    } else {
       setMessDetails(result.mess)
       setStep('confirm')
       setMessage(null)
    }
    setLoading(false)
  }

  const handleJoin = async () => {
    setLoading(true)
    setMessage(null)
    
    const joinFormData = new FormData()
    joinFormData.append("code", searchCode) 

    const result = await joinMess(joinFormData)

    if (result?.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: "Join request sent! Waiting for manager approval." })
      setStep('search') 
      setMessDetails(null)
      setSearchCode("")
    }
    setLoading(false)
  }

  return (
    <Card className="glass-card transition-all duration-300">
      <CardHeader>
        <CardTitle>{step === 'search' ? 'Join Existing Mess' : 'Confirm Join'}</CardTitle>
        <CardDescription>{step === 'search' ? 'Enter the mess code to find your mess' : 'Verify details before joining'}</CardDescription>
      </CardHeader>
      
      {step === 'search' ? (
          <form onSubmit={handleSearch}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="join-code">Mess Code</Label>
                <div className="relative">
                    <Input id="join-code" name="code" placeholder="ENTER CODE" required className="uppercase font-mono tracking-widest" />
                </div>
              </div>
              {message && (
                <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${message.type === 'error' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                   {message.type === 'error' ? <AlertCircle className="h-4 w-4"/> : <CheckCircle2 className="h-4 w-4"/>}
                   {message.text}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button type="submit" variant="secondary" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? "Searching..." : "Find Mess"}
              </Button>
            </CardFooter>
          </form>
      ) : (
          <div>
            <CardContent className="space-y-4">
               <div className="p-4 bg-muted/50 rounded-lg border border-dashed space-y-2 text-center">
                   <h3 className="font-bold text-xl text-primary">{messDetails?.name}</h3>
                   <p className="text-sm text-muted-foreground">Manager: {messDetails?.profiles?.name}</p>
                   <p className="text-xs text-muted-foreground mt-2">Code: <span className="font-mono">{searchCode}</span></p>
               </div>
               
               {message && (
                <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${message.type === 'error' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                   {message.type === 'error' ? <AlertCircle className="h-4 w-4"/> : <CheckCircle2 className="h-4 w-4"/>}
                   {message.text}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex gap-2">
               <Button variant="ghost" className="w-full" onClick={() => { setStep('search'); setMessage(null); }}>Cancel</Button>
               <Button className="w-full" onClick={handleJoin} disabled={loading}>
                 {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                 {loading ? "Joining..." : "Confirm & Join"}
               </Button>
            </CardFooter>
          </div>
      )}
    </Card>
  )
}

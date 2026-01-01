import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell, AlertCircle, Info } from "lucide-react"

export default async function UpdatesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const notices = [
    { title: "System Maintenance", description: "Scheduled maintenance on Sunday 2 AM.", date: "Today", type: "alert" },
    { title: "New Feature", description: "You can now view detailed meal logs.", date: "Yesterday", type: "info" },
    { title: "Welcome", description: "Welcome to the new Mess Master dashboard!", date: "2 days ago", type: "default" },
  ]

  return (
    <div className="container py-8 space-y-8">
       <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gradient">Updates & Notifications</h1>
            <p className="text-muted-foreground">Stay informed about mess activities</p>
          </div>
       </div>

       <div className="grid gap-4">
          {notices.map((notice, i) => (
             <Card key={i} className="glass-card hover:bg-muted/50 transition-colors">
                 <CardContent className="p-4 flex items-start gap-4">
                    <div className={`p-2 rounded-full ${notice.type === 'alert' ? 'bg-red-100 text-red-600' : notice.type === 'info' ? 'bg-blue-100 text-blue-600' : 'bg-secondary text-secondary-foreground'}`}>
                        {notice.type === 'alert' ? <AlertCircle className="h-5 w-5"/> : notice.type === 'info' ? <Info className="h-5 w-5"/> : <Bell className="h-5 w-5"/>}
                    </div>
                    <div className="flex-1">
                        <h4 className="font-semibold">{notice.title}</h4>
                        <p className="text-sm text-muted-foreground">{notice.description}</p>
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                        {notice.date}
                    </div>
                 </CardContent>
             </Card>
          ))}
       </div>
    </div>
  )
}

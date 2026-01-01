"use client"

import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"
import { motion } from "framer-motion"

interface StatsCardProps {
  title: string
  value: string | number
  subValue?: string
  icon: LucideIcon
  trend?: {
    value: number
    label: string
    positive?: boolean
  }
  variant?: "default" | "primary" | "gradient"
  className?: string
  delay?: number
}

export function StatsCard({ 
  title, 
  value, 
  subValue, 
  icon: Icon, 
  trend, 
  variant = "default",
  className,
  delay = 0
}: StatsCardProps) {
  
  const variants = {
    default: "glass-card hover:-translate-y-1 hover:shadow-lg transition-all duration-300",
    primary: "bg-primary text-primary-foreground shadow-lg hover:-translate-y-1 transition-all duration-300",
    gradient: "bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white shadow-xl hover:-translate-y-1 transition-all duration-300 border-none"
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay * 0.1 }}
      className={cn("rounded-2xl p-6 relative overflow-hidden", variants[variant], className)}
    >
      <div className="flex items-center justify-between">
        <div className="relative z-10">
          <p className={cn("text-sm font-medium mb-1", variant === "default" ? "text-muted-foreground" : "text-white/80")}>
            {title}
          </p>
          <h3 className="text-3xl font-bold tracking-tight">
            {value}
          </h3>
          {subValue && (
            <p className={cn("text-xs mt-1", variant === "default" ? "text-muted-foreground" : "text-white/70")}>
              {subValue}
            </p>
          )}
        </div>
        
        <div className={cn(
          "p-3 rounded-xl", 
          variant === "default" ? "bg-primary/10 text-primary" : "bg-white/20 text-white backdrop-blur-sm"
        )}>
          <Icon className="h-6 w-6" />
        </div>
      </div>

      {/* Decorative Blob for Default Variant */}
      {variant === "default" && (
         <div className="absolute -bottom-4 -right-4 h-24 w-24 rounded-full bg-primary/5 blur-2xl" />
      )}
      
      {/* Trend Indicator (Optional) */}
      {trend && (
         <div className={cn("mt-4 flex items-center text-xs font-medium", 
             trend.positive ? "text-green-500" : "text-red-500",
             variant !== "default" && "text-white"
         )}>
             {trend.positive ? "+" : ""}{trend.value}%
             <span className={cn("ml-1 font-normal", variant === "default" ? "text-muted-foreground" : "text-white/70")}>{trend.label}</span>
         </div>
      )}
    </motion.div>
  )
}

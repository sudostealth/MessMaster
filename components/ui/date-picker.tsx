"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Calendar as CalendarIcon } from "lucide-react"

export interface DatePickerProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
  ({ className, ...props }, ref) => {
    return (
      <div className="relative">
        <div className="absolute left-3 top-3 text-muted-foreground pointer-events-none">
           <CalendarIcon className="h-4 w-4" />
        </div>
        <input
          type="date"
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
    )
  }
)
DatePicker.displayName = "DatePicker"

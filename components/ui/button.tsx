import * as React from "react"
import { cn } from "@/lib/utils"
import styles from "./button.module.css"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "outline" | "ghost" | "link" | "destructive"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const variantClass = styles[variant]
    const sizeClass = styles[`s_${size}`]
    
    return (
      <button
        className={cn(styles.button, variantClass, sizeClass, className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }

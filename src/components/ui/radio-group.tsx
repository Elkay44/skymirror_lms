"use client"

import * as React from "react"
import { Circle } from "lucide-react"
import { cn } from "@/lib/utils"

interface RadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string
  onValueChange?: (value: string) => void
}

const RadioGroupContext = React.createContext<{
  value?: string
  onValueChange?: (value: string) => void
}>({});

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ className, value, onValueChange, children, ...props }, ref) => {
    return (
      <RadioGroupContext.Provider value={{ value, onValueChange }}>
        <div 
          role="radiogroup"
          ref={ref} 
          className={cn("grid gap-2", className)} 
          {...props}
        >
          {children}
        </div>
      </RadioGroupContext.Provider>
    )
  }
)
RadioGroup.displayName = "RadioGroup"

interface RadioGroupItemProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string
}

const RadioGroupItem = React.forwardRef<HTMLDivElement, RadioGroupItemProps>(
  ({ className, value, children }, ref) => {
    const { value: groupValue, onValueChange } = React.useContext(RadioGroupContext)
    const checked = groupValue === value
    
    return (
      <div 
        className="flex items-center space-x-2">
        <div 
          ref={ref}
          className={cn(
            "flex items-center justify-center",
            "aspect-square h-4 w-4 rounded-full border border-primary",
            checked ? "bg-primary text-primary-foreground" : "bg-background",
            "ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          onClick={() => onValueChange?.(value)}
        >
          {checked && <Circle className="h-2.5 w-2.5 fill-current text-current" />}
        </div>
        {children && <span>{children}</span>}
      </div>
    )
  }
)
RadioGroupItem.displayName = "RadioGroupItem"

export { RadioGroup, RadioGroupItem }

"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

export interface CalendarProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  month?: Date
  selected?: Date
  onSelect?: (date: Date) => void
  disabled?: (date: Date) => boolean
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function Calendar({
  className,
  month: propMonth,
  selected,
  onSelect,
  disabled,
  ...props
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(propMonth || new Date())
  
  // Set the current month to the first day of the month
  const firstDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  )
  
  // Format month name
  const monthName = firstDayOfMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })
  
  // Handle month navigation
  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }
  
  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }
  
  // Get days to display
  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate()
  
  // Get day of the week for the first day (0 = Sunday, 6 = Saturday)
  const firstDayOfWeek = firstDayOfMonth.getDay()
  
  // Create calendar grid
  const days = []
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfWeek; i++) {
    days.push(null)
  }
  
  // Add days of the current month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day))
  }
  
  // Check if a date is selected
  const isSelected = (date: Date) => {
    return selected && 
      date.getDate() === selected.getDate() && 
      date.getMonth() === selected.getMonth() && 
      date.getFullYear() === selected.getFullYear()
  }
  
  // Check if a date is today
  const isToday = (date: Date) => {
    const today = new Date()
    return date.getDate() === today.getDate() && 
      date.getMonth() === today.getMonth() && 
      date.getFullYear() === today.getFullYear()
  }
  
  // Check if a date is disabled
  const isDateDisabled = (date: Date) => {
    return disabled ? disabled(date) : false
  }
  
  return (
    <div className={cn("p-3", className)} {...props}>
      <div className="flex justify-center pt-1 relative items-center mb-4">
        <button
          type="button"
          onClick={goToPreviousMonth}
          className="absolute left-1 h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 rounded-md border border-input"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="text-sm font-medium">{monthName}</div>
        <button
          type="button"
          onClick={goToNextMonth}
          className="absolute right-1 h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 rounded-md border border-input"
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {/* Header row for days of the week */}
        {DAYS.map((day) => (
          <div key={day} className="text-center text-muted-foreground text-xs py-1">
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {days.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className="h-9 w-9" />;
          }
          
          const dayDisabled = isDateDisabled(date)
          
          return (
            <button
              key={date.toISOString()}
              type="button"
              onClick={() => !dayDisabled && onSelect?.(date)}
              disabled={dayDisabled}
              className={cn(
                "h-9 w-9 rounded-md flex items-center justify-center text-sm",
                isSelected(date) && "bg-primary text-primary-foreground",
                isToday(date) && !isSelected(date) && "bg-accent text-accent-foreground",
                dayDisabled && "text-muted-foreground opacity-50",
                !isSelected(date) && !isToday(date) && !dayDisabled && "hover:bg-accent hover:text-accent-foreground"
              )}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  )
}

Calendar.displayName = "Calendar"

export { Calendar }

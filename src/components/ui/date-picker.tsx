"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { Button } from "./button"
import { cn } from "@/lib/utils"

// Create our own Popover components instead of importing them
const PopoverContext = React.createContext<{
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}>({ open: false, setOpen: () => {} });

type PopoverProps = {
  children: React.ReactNode;
};

function Popover({ children }: PopoverProps) {
  const [open, setOpen] = React.useState(false);
  return (
    <PopoverContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block w-full">{children}</div>
    </PopoverContext.Provider>
  );
}

type PopoverTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
};

function PopoverTrigger({ asChild, children, ...props }: PopoverTriggerProps) {
  const { open, setOpen } = React.useContext(PopoverContext);

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ...props,
      onClick: (e: React.MouseEvent) => {
        setOpen(!open);
        if (children.props.onClick) children.props.onClick(e);
        if (props.onClick) props.onClick(e as React.MouseEvent<HTMLButtonElement>);
      },
    } as any);
  }

  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      {...props}
    >
      {children}
    </button>
  );
}

type PopoverContentProps = React.HTMLAttributes<HTMLDivElement> & {
  align?: "start" | "center" | "end";
};

function PopoverContent({ align = "center", className, children, ...props }: PopoverContentProps) {
  const { open } = React.useContext(PopoverContext);
  
  if (!open) return null;
  
  return (
    <div
      className={cn(
        "absolute z-50 mt-1 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none animate-in fade-in-0 zoom-in-95",
        align === "start" ? "left-0" : align === "end" ? "right-0" : "left-1/2 -translate-x-1/2",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// Create a simplified Calendar component
type CalendarProps = {
  mode?: "single" | "range" | "multiple";
  selected?: Date | null;
  onSelect?: (date: Date | undefined) => void;
  initialFocus?: boolean;
  className?: string;
};

function Calendar({ selected, onSelect, className }: CalendarProps) {
  // Just show a simple date selector for now
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  
  const isSelected = (day: number) => {
    return selected && selected.getDate() === day && 
           selected.getMonth() === today.getMonth() && 
           selected.getFullYear() === today.getFullYear();
  };
  
  const monthName = today.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  
  return (
    <div className={cn("p-3", className)}>
      <div className="text-center font-medium py-2">{monthName}</div>
      <div className="grid grid-cols-7 gap-1">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(day => (
          <div key={day} className="text-center text-xs text-muted-foreground">
            {day}
          </div>
        ))}
        
        {/* Add empty cells for days before the 1st of the month */}
        {Array.from({ length: new Date(today.getFullYear(), today.getMonth(), 1).getDay() }, (_, i) => (
          <div key={`empty-${i}`} />
        ))}
        
        {days.map(day => (
          <button
            key={day}
            onClick={() => onSelect?.(new Date(today.getFullYear(), today.getMonth(), day))}
            className={cn(
              "h-8 w-8 rounded-md flex items-center justify-center text-sm",
              isSelected(day) ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            )}
          >
            {day}
          </button>
        ))}
      </div>
    </div>
  );
}

interface DatePickerProps {
  date?: Date;
  setDate: (date: Date | undefined) => void;
}

export function DatePicker({ date, setDate }: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}

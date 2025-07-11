"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface PopoverContextValue {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
  triggerRef: React.RefObject<HTMLButtonElement>
}

const PopoverContext = React.createContext<PopoverContextValue | undefined>(undefined)

function usePopoverContext() {
  const context = React.useContext(PopoverContext)
  if (!context) {
    throw new Error("usePopoverContext must be used within a Popover")
  }
  return context
}

interface PopoverProps {
  children: React.ReactNode
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const Popover = ({ children, defaultOpen = false, open: controlledOpen, onOpenChange }: PopoverProps) => {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen)
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  
  const open = controlledOpen ?? uncontrolledOpen
  const setOpen = React.useCallback((newOpen: boolean | ((prevState: boolean) => boolean)) => {
    if (typeof newOpen === "function") {
      const nextOpen = newOpen(open)
      if (controlledOpen === undefined) {
        setUncontrolledOpen(nextOpen)
      }
      onOpenChange?.(nextOpen)
    } else {
      if (controlledOpen === undefined) {
        setUncontrolledOpen(newOpen)
      }
      onOpenChange?.(newOpen)
    }
  }, [controlledOpen, onOpenChange, open])

  return (
    <PopoverContext.Provider value={{ open, setOpen, triggerRef }}>
      {children}
    </PopoverContext.Provider>
  )
}

Popover.displayName = "Popover"

interface PopoverTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
}

const PopoverTrigger = React.forwardRef<HTMLButtonElement, PopoverTriggerProps>(
  ({ onClick, asChild = false, children, ...props }, forwardedRef) => {
    const { open, setOpen, triggerRef } = usePopoverContext()
    // Use forwarded ref if provided, otherwise use context ref
    React.useEffect(() => {
      if (forwardedRef && triggerRef.current) {
        if (typeof forwardedRef === "function") {
          forwardedRef(triggerRef.current)
        } else {
          // This is a safe cast because we're checking for the existence
          // of triggerRef.current
          forwardedRef.current = triggerRef.current
        }
      }
    }, [forwardedRef, triggerRef.current])

    if (asChild) {
      // If asChild is true, we expect children to be a single React element
      const child = React.isValidElement(children) ? children : <button>{children}</button>
      return React.cloneElement(child, {
        ref: triggerRef,
        onClick: (event: React.MouseEvent<HTMLElement>) => {
          child.props.onClick?.(event)
          onClick?.(event as React.MouseEvent<HTMLButtonElement>)
          setOpen(!open)
        },
        ...props,
      } as any)
    }

    return (
      <button
        ref={triggerRef}
        onClick={(event) => {
          onClick?.(event)
          setOpen(!open)
        }}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        {...props}
      >
        {children}
      </button>
    )
  }
)

PopoverTrigger.displayName = "PopoverTrigger"

interface PopoverContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: "start" | "center" | "end"
  sideOffset?: number
}

const PopoverContent = React.forwardRef<HTMLDivElement, PopoverContentProps>(
  ({ className, align = "center", sideOffset = 4, ...props }, ref) => {
    const { open, triggerRef } = usePopoverContext()
    const [position, setPosition] = React.useState({ top: 0, left: 0 })
    
    // Use a callback ref to measure positioning without needing to update contentRef.current
    const measureRef = React.useCallback((node: HTMLDivElement | null) => {
      if (open && triggerRef.current && node) {
        const triggerRect = triggerRef.current.getBoundingClientRect()
        const contentRect = node.getBoundingClientRect()
        
        let left = triggerRect.left
        if (align === "center") {
          left = triggerRect.left + triggerRect.width / 2 - contentRect.width / 2
        } else if (align === "end") {
          left = triggerRect.right - contentRect.width
        }
        
        setPosition({
          top: triggerRect.bottom + sideOffset + window.scrollY,
          left: Math.max(8, left + window.scrollX)
        })
      }
    }, [open, align, sideOffset, triggerRef]);
    
    // Combine refs
    const combinedRef = React.useCallback(
      (node: HTMLDivElement | null) => {
        // Handle forwarded ref
        if (ref) {
          if (typeof ref === "function") ref(node)
          else if (node) ref.current = node
        }
        // Handle measurement ref
        measureRef(node);
      },
      [ref, measureRef]
    );
    
    if (!open) return null;
    
    return (
      <div
        ref={combinedRef}
        className={cn(
          "w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none animate-in fade-in-0 zoom-in-95",
          className
        )}
        style={{
          position: "absolute",
          top: `${position.top}px`,
          left: `${position.left}px`,
          zIndex: 50
        }}
        {...props}
      />
    )
  }
)

PopoverContent.displayName = "PopoverContent"

export { Popover, PopoverTrigger, PopoverContent }

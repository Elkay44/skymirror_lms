"use client"

import * as React from "react"

type ToastType = "default" | "destructive"

type Toast = {
  id: string
  title: string
  description?: string
  type?: ToastType
  action?: {
    label: string
    onClick: () => void
  }
}

type ToastOptions = {
  id?: string
  title: string
  description?: string
  type?: ToastType
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

type ToastContextType = {
  toasts: Toast[]
  toast: (options: ToastOptions) => void
  dismiss: (id: string) => void
}

const ToastContext = React.createContext<ToastContextType | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  const toast = ({
    id,
    title,
    description,
    type = "default",
    duration = 5000,
    action,
  }: ToastOptions) => {
    const toastId = id || Math.random().toString(36).substring(2, 9)
    
    setToasts((currentToasts) => [
      ...currentToasts,
      { id: toastId, title, description, type, action },
    ])

    if (duration > 0) {
      setTimeout(() => {
        dismiss(toastId)
      }, duration)
    }

    return toastId
  }

  const dismiss = (id: string) => {
    setToasts((currentToasts) =>
      currentToasts.filter((toast) => toast.id !== id)
    )
  }

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}

export function Toaster() {
  const { toasts, dismiss } = useToast()

  if (toasts.length <= 0) return null

  return (
    <div className="fixed bottom-0 right-0 z-50 flex flex-col p-4 space-y-2 max-w-xs w-full sm:max-w-sm min-w-0">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "relative flex items-center justify-between w-full p-4 rounded-lg shadow-lg",
            "bg-white dark:bg-gray-800",
            "border border-gray-200 dark:border-gray-700",
            "text-gray-900 dark:text-gray-50",
            toast.type === "destructive" ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400" : ""
          )}
        >
          <div className="flex-1 min-w-0">
            <div className="font-medium break-words">{toast.title}</div>
            {toast.description && (
              <div className="text-sm text-gray-500 dark:text-gray-400 break-words">
                {toast.description}
              </div>
            )}
          </div>
          {toast.action && (
            <button
              onClick={() => {
                toast.action?.onClick()
                dismiss(toast.id)
              }}
              className="ml-4 text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 break-words"
            >
              {toast.action.label}
            </button>
          )}
          <button
            onClick={() => dismiss(toast.id)}
            className="absolute top-2 right-2 p-1 rounded-full text-gray-400 hover:text-gray-500 flex-shrink-0"
          >
            <span className="sr-only">Close</span>
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      ))}
    </div>
  )
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(" ")
}

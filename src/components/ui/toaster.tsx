
import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import * as React from "react"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts && toasts.map && toasts.map(function ({ id, title, description, action, ...props }) {
        // Filter out incompatible props that might come from Sonner
        // We need to specifically remove 'type' if it exists and isn't compatible
        const { type, ...compatibleProps } = props as any;
        
        return (
          <Toast key={id} {...compatibleProps}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action && React.isValidElement(action) ? action : null}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}

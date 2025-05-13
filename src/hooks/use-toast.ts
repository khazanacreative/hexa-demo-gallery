
import * as React from "react";
import { Toast, ToastActionElement, ToastProps } from "@/components/ui/toast";
import { 
  toast as sonnerToast, 
  ToastT,
} from "sonner";

type ToastOptions = ToastProps & {
  title?: string;
  description?: string;
  action?: ToastActionElement;
  variant?: "default" | "destructive" | "success";
  duration?: number;
};

const DEFAULT_TOAST_DURATION = 5000;

export function toast(opts: ToastOptions) {
  const { title, description, variant = "default", ...props } = opts;
  
  // Log the toast details to console for debugging
  console.log("[Toast]", { title, description, variant });
  
  // Determine the Sonner preset based on variant
  if (variant === "destructive") {
    return sonnerToast.error(title, {
      description,
      ...props,
    });
  } else if (variant === "success") {
    return sonnerToast.success(title, {
      description,
      ...props,
    });
  } else {
    return sonnerToast(title, {
      description,
      ...props,
    });
  }
}

export function useToast() {
  // Create a local state for tracking toasts
  const [toasts, setToasts] = React.useState<ToastT[]>([]);
  
  // Since sonnerToast.subscribe is not available, we'll use our own state management
  // We'll just return an empty array for toasts, since the Sonner component handles rendering
  
  return {
    toast,
    dismiss: sonnerToast.dismiss,
    toasts: [], // Empty array as fallback
  };
}

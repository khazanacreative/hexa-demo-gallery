
import * as React from "react";
import { Toast, ToastActionElement, ToastProps } from "@/components/ui/toast";
import { 
  toast as sonnerToast, 
  ToastT,
  Toaster as SonnerToaster,
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
  // Get access to toast functions
  const [toasts, setToasts] = React.useState<ToastT[]>([]);
  
  // Use React's useEffect to sync with sonner's toast state
  React.useEffect(() => {
    // Subscribe to toasts
    const unsubscribe = sonnerToast.subscribe((toast) => {
      if (toast.id) {
        setToasts((prev) => [...prev.filter(t => t.id !== toast.id), toast]);
      }
    });
    
    // Cleanup subscription
    return () => {
      unsubscribe();
    };
  }, []);
  
  return {
    toast,
    dismiss: sonnerToast.dismiss,
    toasts,
  };
}

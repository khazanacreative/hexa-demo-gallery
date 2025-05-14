
import * as React from "react";
import { Toast, ToastActionElement, ToastProps } from "@/components/ui/toast";
import { 
  toast as sonnerToast, 
  ToastT,
} from "sonner";

type ToastVariant = "default" | "destructive" | "success";

type ToastOptions = ToastProps & {
  title?: string;
  description?: string;
  action?: ToastActionElement;
  variant?: ToastVariant;
  duration?: number;
};

const DEFAULT_TOAST_DURATION = 5000;

export function toast(opts: ToastOptions) {
  const { title, description, variant = "default", ...props } = opts;
  
  // Log the toast details to console for debugging
  console.log("[Toast]", { title, description, variant });
  
  // Use a type-safe approach with a switch statement
  switch (variant) {
    case "destructive":
      return sonnerToast.error(title, {
        description,
        ...props,
      });
    case "success":
      return sonnerToast.success(title, {
        description,
        ...props,
      });
    case "default":
    default:
      return sonnerToast(title, {
        description,
        ...props,
      });
  }
}

export function useToast() {
  // Since sonnerToast.subscribe is not available, we'll just expose the needed methods
  // We won't try to track toast state locally since Sonner handles this internally
  
  return {
    toast,
    dismiss: sonnerToast.dismiss,
    toasts: [] as ToastT[], // Cast to correct type to satisfy the interface
  };
}

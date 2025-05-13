
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

export function toast(
  opts: ToastOptions
) {
  const { title, description, variant = "default", ...props } = opts;
  
  // Log the toast details to console for debugging
  console.log("[Toast]", { title, description, variant });
  
  // Determine the Sonner preset based on our variant
  const preset = variant === "destructive" ? "error" : 
                variant === "success" ? "success" : "default";
  
  return sonnerToast[preset](title, {
    description,
    ...props,
  });
}

export function useToast() {
  return {
    toast,
    dismiss: sonnerToast.dismiss,
  };
}

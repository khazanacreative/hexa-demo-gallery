
import * as React from "react";
import { toast as sonnerToast } from "sonner";

export type ToastVariant = "default" | "destructive" | "success";

export type ToastOptions = {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: ToastVariant;
  duration?: number;
  className?: string;
  [key: string]: any;
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

type ToastT = {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  dismiss: () => void;
};

export function useToast() {
  return {
    toast,
    dismiss: sonnerToast.dismiss,
    dismissToast: sonnerToast.dismiss,
    toasts: [] as ToastT[], // Cast to correct type to satisfy the interface
  };
}


import * as React from "react";
import { Toaster as SonnerToaster } from "sonner";

interface ToasterProps {
  className?: string;
  toastOptions?: {
    className?: string;
    duration?: number;
    style?: React.CSSProperties;
    unstyled?: boolean;
  };
}

export function Toaster({ 
  className, 
  toastOptions 
}: ToasterProps = {}) {
  return (
    <SonnerToaster
      className={className}
      toastOptions={{
        duration: 5000,
        ...toastOptions,
      }}
    />
  );
}

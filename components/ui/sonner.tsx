"use client"

import { CircleCheckIcon, InfoIcon, Loader2Icon, OctagonXIcon, TriangleAlertIcon } from "lucide-react"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4 text-gold" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      toastOptions={{
        className: "font-sans",
        style: {
          fontFamily: "var(--font-inter)",
        },
      }}
      style={
        {
          "--normal-bg": "#0a1128",
          "--normal-text": "#ffffff",
          "--normal-border": "rgba(212, 175, 53, 0.3)",
          "--border-radius": "var(--radius)",
          "--success-bg": "#0a1128",
          "--success-text": "#ffffff",
          "--success-border": "rgba(212, 175, 53, 0.3)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }

"use client"

import * as React from "react"
import { XIcon } from "lucide-react"
import { Dialog as DialogPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/50 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0",
        className
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
}) {
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          // Base: flex column so DialogScrollBody can flex-grow and
          // DialogStickyFooter can stick at the bottom on every viewport
          // (not just mobile). Height is capped at 90dvh on desktop so
          // landscape phones, short windows, and tablets don't overflow.
          "fixed top-[50%] left-[50%] z-50 flex flex-col w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border bg-background p-6 shadow-lg duration-200 outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 sm:max-w-lg md:max-h-[90dvh]",
          // Mobile (≤md): morph into a bottom-anchored sheet via positioning + animation overrides.
          // Uses dvh so the iOS Safari URL bar collapsing doesn't push the footer offscreen.
          "max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:top-auto max-md:left-0",
          "max-md:translate-x-0 max-md:translate-y-0",
          "max-md:max-w-full max-md:w-full",
          "max-md:rounded-t-2xl max-md:rounded-b-none max-md:border-b-0",
          "max-md:max-h-[95dvh] max-md:p-0 max-md:gap-0",
          "max-md:data-[state=closed]:zoom-out-100 max-md:data-[state=open]:zoom-in-100",
          "max-md:data-[state=closed]:slide-out-to-bottom max-md:data-[state=open]:slide-in-from-bottom",
          // Grabber on mobile — visual affordance that this sheet can be dismissed.
          "max-md:before:content-[''] max-md:before:absolute max-md:before:top-2 max-md:before:left-1/2 max-md:before:-translate-x-1/2 max-md:before:w-9 max-md:before:h-1 max-md:before:rounded-full max-md:before:bg-gray-200",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className="absolute top-4 right-4 rounded-xs opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-hidden cursor-pointer disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 max-md:top-5"
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn(
        "flex flex-col gap-2 text-center sm:text-left",
        // Mobile: inherit panel padding (DialogContent has p-0 on mobile).
        // Top padding makes room for the grabber.
        "max-md:px-6 max-md:pt-6 max-md:pb-2 max-md:shrink-0",
        className
      )}
      {...props}
    />
  )
}

/**
 * Scrollable body for adaptive Dialog. Use this between DialogHeader and
 * DialogStickyFooter when the body might overflow. Always becomes the
 * flex-grow region so the footer stays pinned — applies on desktop too,
 * which is what makes landscape phones, short windows, and tablets behave.
 */
function DialogScrollBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-scroll-body"
      className={cn(
        // All viewports: flex grow + scroll. min-h-0 lets the flex item
        // shrink below its content's intrinsic height so overflow scrolls.
        "flex-1 min-h-0 overflow-y-auto overscroll-contain",
        // 4px padding on every side gives focus rings (3px box-shadow)
        // breathing room inside the scroll container's clip box. Without
        // this, `overflow-y: auto` promotes overflow-x to clip too and the
        // ring is cut off at the input edges. Mobile overrides add the
        // panel padding (DialogContent zeroes its own padding on mobile).
        "p-1",
        "max-md:px-6 max-md:py-4",
        className
      )}
      {...props}
    />
  )
}

/**
 * Sticky footer for adaptive Dialog. Pins to the bottom of the panel with a
 * top divider on every viewport so primary CTAs stay reachable while the
 * body scrolls — solves landscape phones and short desktop windows the
 * same way it solves mobile.
 */
function DialogStickyFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-sticky-footer"
      className={cn(
        "flex items-center justify-between gap-2 shrink-0 border-t border-gray-100 bg-background",
        // Mobile-only: panel padding + safe-area inset (DialogContent has p-0
        // on mobile). On desktop the parent's p-6 already pads us.
        "max-md:px-6 max-md:py-3 max-md:pb-[max(env(safe-area-inset-bottom),0.75rem)]",
        // Desktop: re-add a small top padding to separate from the divider.
        "md:pt-4",
        className
      )}
      {...props}
    />
  )
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close asChild>
          <Button variant="outline">Close</Button>
        </DialogPrimitive.Close>
      )}
    </div>
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-lg leading-none font-semibold", className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogScrollBody,
  DialogStickyFooter,
  DialogTitle,
  DialogTrigger,
}

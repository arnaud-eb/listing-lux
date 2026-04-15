"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ConfirmDeleteDialogProps {
  /** Trigger element — when provided, the dialog is uncontrolled (click to open). */
  trigger?: React.ReactNode;
  /** Controlled open state — use together with onOpenChange for programmatic opening. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Called when the user confirms the deletion. */
  onConfirm: () => void;
  /** Called when the user cancels (optional). */
  onCancel?: () => void;
  /** Dialog title — defaults to "Delete this listing?" */
  title?: string;
  /** Dialog description — defaults to the listing-deletion copy */
  description?: string;
  /** Confirm button label — defaults to "Delete" */
  confirmLabel?: string;
  /** Cancel button label — defaults to "Cancel" */
  cancelLabel?: string;
}

export default function ConfirmDeleteDialog({
  trigger,
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  title = "Delete this listing?",
  description = "This will remove the listing and all generated content from your account. This action cannot be undone.",
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
}: ConfirmDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {trigger && (
        <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      )}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="font-serif text-navy-deep">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            className="rounded-lg shadow-none"
            onClick={onCancel}
          >
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="rounded-lg bg-gold text-navy-deep hover:bg-gold/90 shadow-none"
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

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

interface ConfirmDiscardDialogProps {
  /** Trigger element — when provided, the dialog is uncontrolled (click to open). */
  trigger?: React.ReactNode;
  /** Controlled open state — use together with onOpenChange for programmatic opening. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Called when the user confirms the discard. */
  onConfirm: () => void;
  /** Called when the user cancels (optional). */
  onCancel?: () => void;
}

export default function ConfirmDiscardDialog({
  trigger,
  open,
  onOpenChange,
  onConfirm,
  onCancel,
}: ConfirmDiscardDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {trigger && (
        <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      )}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="font-serif text-navy-deep">
            Discard changes?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Your edits to this listing will be lost.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            className="rounded-lg shadow-none"
            onClick={onCancel}
          >
            Keep editing
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="rounded-lg bg-gold text-navy-deep hover:bg-gold/90 shadow-none"
          >
            Discard
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

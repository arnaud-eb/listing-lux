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
  /** Title text. Default: "Discard changes?" */
  title?: string;
  /** Description text. Default: a generic "Your edits will be lost." */
  description?: string;
  /** Confirm button label. Default: "Discard". */
  confirmLabel?: string;
  /** Cancel button label. Default: "Keep editing". */
  cancelLabel?: string;
}

export default function ConfirmDiscardDialog({
  trigger,
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  title = "Discard changes?",
  description = "Your edits will be lost.",
  confirmLabel = "Discard",
  cancelLabel = "Keep editing",
}: ConfirmDiscardDialogProps) {
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

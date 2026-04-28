"use client";

import { useTranslations } from "next-intl";
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
  title,
  description,
  confirmLabel,
  cancelLabel,
}: ConfirmDiscardDialogProps) {
  const t = useTranslations("dialogs.confirmDiscard");
  const resolvedTitle = title ?? t("title");
  const resolvedDescription = description ?? t("description");
  const resolvedConfirm = confirmLabel ?? t("confirm");
  const resolvedCancel = cancelLabel ?? t("cancel");
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {trigger && (
        <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      )}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="font-serif text-navy-deep">
            {resolvedTitle}
          </AlertDialogTitle>
          <AlertDialogDescription>{resolvedDescription}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            className="rounded-lg shadow-none"
            onClick={onCancel}
          >
            {resolvedCancel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="rounded-lg bg-gold text-navy-deep hover:bg-gold/90 shadow-none"
          >
            {resolvedConfirm}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

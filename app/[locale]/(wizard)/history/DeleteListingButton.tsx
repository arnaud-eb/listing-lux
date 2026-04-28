"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import ConfirmDeleteDialog from "@/components/shared/ConfirmDeleteDialog";
import { deleteProperty } from "./actions";

interface DeleteListingButtonProps {
  propertyId: string;
  title?: string;
  variant?: "card" | "header";
  onDeleted?: () => void;
  disabled?: boolean;
}

export default function DeleteListingButton({
  propertyId,
  title,
  variant = "card",
  onDeleted,
  disabled,
}: DeleteListingButtonProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("wizard.history.deleteButton");

  function handleConfirm() {
    startTransition(async () => {
      try {
        await deleteProperty(propertyId);
        toast.success(t("toastSuccess"));
        setOpen(false);
        onDeleted?.();
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : t("toastFailureDefault"),
        );
      }
    });
  }

  if (variant === "card") {
    return (
      <>
        <button
          type="button"
          aria-label={
            title ? t("ariaLabelNamed", { title }) : t("ariaLabelGeneric")
          }
          disabled={isPending}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen(true);
          }}
          className="absolute top-3 right-3 z-10 size-9 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm text-gray-400 hover:text-red-500 hover:bg-white shadow-sm border border-gray-100 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 focus-visible:opacity-100 transition-opacity cursor-pointer disabled:opacity-50"
        >
          <Trash2 className="size-3.5" />
        </button>
        <ConfirmDeleteDialog
          open={open}
          onOpenChange={setOpen}
          onConfirm={handleConfirm}
        />
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        disabled={isPending || disabled}
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-gray-200 text-sm text-gray-400 hover:text-red-500 hover:bg-gray-50 shadow-none transition-colors cursor-pointer disabled:opacity-50 disabled:hover:text-gray-400 disabled:hover:bg-transparent"
      >
        <Trash2 className="size-3" />
        {t("label")}
      </button>
      <ConfirmDeleteDialog
        open={open}
        onOpenChange={setOpen}
        onConfirm={handleConfirm}
      />
    </>
  );
}

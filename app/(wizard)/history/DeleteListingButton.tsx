"use client";

import { useState, useTransition } from "react";
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

  function handleConfirm() {
    startTransition(async () => {
      try {
        await deleteProperty(propertyId);
        toast.success("Listing deleted");
        setOpen(false);
        onDeleted?.();
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to delete listing",
        );
      }
    });
  }

  // Card variant — small floating icon button on /history cards
  if (variant === "card") {
    return (
      <>
        <button
          type="button"
          aria-label={title ? `Delete ${title}` : "Delete listing"}
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

  // Header variant — used in /listing/[id] page header, mirrors /create "Start Over"
  return (
    <>
      <button
        type="button"
        disabled={isPending || disabled}
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-gray-200 text-sm text-gray-400 hover:text-red-500 hover:bg-gray-50 shadow-none transition-colors cursor-pointer disabled:opacity-50 disabled:hover:text-gray-400 disabled:hover:bg-transparent mt-3 lg:absolute lg:right-0 lg:top-2"
      >
        <Trash2 className="size-3" />
        Delete
      </button>
      <ConfirmDeleteDialog
        open={open}
        onOpenChange={setOpen}
        onConfirm={handleConfirm}
      />
    </>
  );
}

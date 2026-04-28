"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverArrow,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Listing, Property } from "@/lib/types";
import { useIsMobile } from "@/lib/hooks/use-is-mobile";
import CopyMenu from "./CopyMenu";
import PdfExportWizard from "./PdfExportWizard";

interface ExportMenuProps {
  hideTextOnMobile?: boolean;
  listing: Partial<Listing> | null;
  property: Property | null;
  isEditing?: boolean;
  isGenerating?: boolean;
}

export default function ExportMenu({
  hideTextOnMobile,
  listing,
  property,
  isEditing,
  isGenerating,
}: ExportMenuProps) {
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const t = useTranslations("wizard.listing.exportMenu");
  const tWizard = useTranslations("wizard.listing.pdfWizard");

  const hasCompleteListing = Boolean(listing?.title && listing?.description);
  const isDisabled = !hasCompleteListing || isEditing || isGenerating;

  const handlePdfClick = () => {
    setMenuOpen(false);
    setPdfDialogOpen(true);
  };

  const triggerButton = (
    <Button
      type="button"
      variant="outline"
      disabled={isDisabled}
      className="gap-1.5 rounded-lg border-gray-300 text-gray-700 shadow-none"
    >
      <Download size={14} />
      <span className={hideTextOnMobile ? "max-sm:hidden" : undefined}>
        {t("export")}
      </span>
    </Button>
  );

  // The Copy/Export menu surface morphs based on viewport: anchored Popover on
  // desktop, bottom-sheet Dialog on mobile. The same `<CopyMenu>` content
  // renders in either container — no logic duplicated.
  return (
    <>
      {isMobile ? (
        <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
          <DialogTrigger asChild>{triggerButton}</DialogTrigger>
          <DialogContent
            className="max-w-md p-0 gap-0 sm:p-0"
            showCloseButton={false}
          >
            <DialogHeader className="sr-only">
              <DialogTitle>{tWizard("title")}</DialogTitle>
            </DialogHeader>
            {hasCompleteListing && listing && property && (
              <CopyMenu
                listing={listing}
                property={property}
                onPdfClick={handlePdfClick}
              />
            )}
          </DialogContent>
        </Dialog>
      ) : (
        <Popover open={menuOpen} onOpenChange={setMenuOpen}>
          <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
          <PopoverContent
            side="top"
            align="end"
            className="max-w-90 w-[calc(100vw-2rem)] p-0"
          >
            <PopoverArrow className="fill-white" />
            {hasCompleteListing && listing && property && (
              <CopyMenu
                listing={listing}
                property={property}
                onPdfClick={handlePdfClick}
              />
            )}
          </PopoverContent>
        </Popover>
      )}

      {/* Lazy-mounted only when the user opens it — keeps the shell light. */}
      {pdfDialogOpen && property && (
        <PdfExportWizard
          open={pdfDialogOpen}
          onOpenChange={setPdfDialogOpen}
          property={property}
        />
      )}
    </>
  );
}

"use client";

import { useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogScrollBody,
  DialogStickyFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import PhotoSelector from "@/components/listing/PhotoSelector";

interface PhotosStepProps {
  stepIndex: number;
  totalSteps: number;
  photoUrls: string[];
  selectedPhotos: string[];
  maxPhotos: number;
  onTogglePhoto: (url: string) => void;
  onClearPhotos: () => void;
  onBack: (() => void) | null;
  onContinue: () => void;
}

export default function PhotosStep({
  stepIndex,
  totalSteps,
  photoUrls,
  selectedPhotos,
  maxPhotos,
  onTogglePhoto,
  onClearPhotos,
  onBack,
  onContinue,
}: PhotosStepProps) {
  const hasSelection = selectedPhotos.length > 0;
  const t = useTranslations("wizard.listing.pdfWizard.photos");

  return (
    <>
      <DialogHeader>
        <div className="text-2xs text-gray-400 uppercase tracking-wider mb-1">
          {t("stepLabel", { step: stepIndex, total: totalSteps })}
        </div>
        <DialogTitle className="font-serif text-navy-deep">
          {t("title")}
        </DialogTitle>
        <DialogDescription>
          {t("description", { max: maxPhotos })}
        </DialogDescription>
      </DialogHeader>

      <DialogScrollBody>
        <PhotoSelector
          photoUrls={photoUrls}
          selected={selectedPhotos}
          onToggle={onTogglePhoto}
          onClear={onClearPhotos}
          max={maxPhotos}
          hideFooter
        />
      </DialogScrollBody>

      <DialogStickyFooter>
        {/* Don't put text-color classes on this wrapper — shadcn outline
            Button has no explicit text color and will inherit, washing out
            the Back button. Set text colors on the counter / Clear children
            individually. */}
        <div className="flex items-center gap-3 min-w-0">
          {onBack ? (
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              className="gap-1.5 rounded-lg border-gray-300 shadow-none"
            >
              <ArrowLeft className="size-3.5" />
              {t("back")}
            </Button>
          ) : null}
          <p aria-live="polite" className="truncate text-xs text-gray-400">
            {t("selected", { count: selectedPhotos.length, max: maxPhotos })}
          </p>
          {hasSelection && (
            <button
              type="button"
              onClick={onClearPhotos}
              className="text-xs text-gray-500 hover:text-navy-deep transition-colors cursor-pointer outline-none focus-visible:text-navy-deep focus-visible:underline underline-offset-4 shrink-0"
            >
              {t("clear")}
            </button>
          )}
        </div>
        <Button
          type="button"
          onClick={onContinue}
          className="gap-1.5 rounded-lg bg-gold text-navy-deep hover:bg-gold/90 shadow-none font-semibold shrink-0"
        >
          {t("continue")}
        </Button>
      </DialogStickyFooter>
    </>
  );
}

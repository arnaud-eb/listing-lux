"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ConfirmDiscardDialog from "@/components/shared/ConfirmDiscardDialog";
import { LANGUAGES } from "@/lib/constants";
import type { AgentProfile, Language, Property } from "@/lib/types";
import { getAgentProfile } from "@/app/[locale]/(wizard)/profile/actions";
import { downloadPDF } from "@/lib/pdf-client";
import { useWizardSteps } from "./useWizardSteps";
import BrandingStep from "./steps/BrandingStep";
import PhotosStep from "./steps/PhotosStep";
import LanguagesStep from "./steps/LanguagesStep";

const MAX_PHOTOS = 5;

interface PdfExportWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property: Property;
}

/**
 * Multi-step PDF export wizard. Renders into the adaptive Dialog —
 * centered modal on desktop, full-height bottom sheet on mobile.
 *
 * Linear flow: Photos → Languages (always 2 steps).
 * Branding is a sub-flow reached only from the Languages step's Add/Edit
 * card — never as a numbered step. Same UX whether the user has a profile
 * or not; the Languages card adapts (populated vs empty-state).
 */
export default function PdfExportWizard({
  open,
  onOpenChange,
  property,
}: PdfExportWizardProps) {
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profile, setProfile] = useState<AgentProfile | null>(null);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] =
    useState<Language[]>([...LANGUAGES]);
  const [isDownloading, setIsDownloading] = useState(false);
  // Whether the Branding sub-flow is currently visible. Reached only from
  // the Languages step's Add/Edit card.
  const [editingBranding, setEditingBranding] = useState(false);
  const wizard = useWizardSteps();
  const t = useTranslations("wizard.listing.pdfWizard");

  // Branding step's dirty state, lifted so we can guard every discard path:
  // Cancel button, dialog X close, overlay click, Esc. All four routes
  // funnel through `requestDiscard` which either confirms immediately
  // (clean) or opens ConfirmDiscardDialog (dirty).
  const [brandingDirty, setBrandingDirty] = useState(false);
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false);
  const pendingDiscardActionRef = useRef<(() => void) | null>(null);

  const requestDiscard = useCallback(
    (action: () => void) => {
      if (editingBranding && brandingDirty) {
        pendingDiscardActionRef.current = action;
        setDiscardConfirmOpen(true);
        return;
      }
      action();
    },
    [editingBranding, brandingDirty],
  );

  const handleConfirmDiscard = useCallback(() => {
    setDiscardConfirmOpen(false);
    setBrandingDirty(false);
    const action = pendingDiscardActionRef.current;
    pendingDiscardActionRef.current = null;
    action?.();
  }, []);

  const handleKeepEditing = useCallback(() => {
    pendingDiscardActionRef.current = null;
    setDiscardConfirmOpen(false);
  }, []);

  // Intercept the wizard's own close paths (X button, overlay click, Esc).
  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) {
        requestDiscard(() => onOpenChange(false));
        return;
      }
      onOpenChange(true);
    },
    [requestDiscard, onOpenChange],
  );

  // Load profile + reset selections each time the dialog opens.
  useEffect(() => {
    if (!open) return;

    setIsLoadingProfile(true);
    setSelectedPhotos((property.photo_urls ?? []).slice(0, MAX_PHOTOS));
    setSelectedLanguages([...LANGUAGES]);
    setEditingBranding(false);
    setBrandingDirty(false);
    setDiscardConfirmOpen(false);
    pendingDiscardActionRef.current = null;
    wizard.reset();

    let cancelled = false;
    (async () => {
      try {
        const fetched = await getAgentProfile();
        if (cancelled) return;
        setProfile(fetched);
      } catch {
        if (cancelled) return;
        setProfile(null);
      } finally {
        if (!cancelled) setIsLoadingProfile(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // Depend on `property.id` (stable string) instead of the `property`
    // object reference. revalidatePath after save would otherwise re-trigger
    // init mid-flow. wizard.reset is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, property.id]);

  const handleEditBranding = useCallback(() => {
    setEditingBranding(true);
  }, []);

  const handleProfileSaved = useCallback((saved: AgentProfile) => {
    setProfile(saved);
    setEditingBranding(false);
  }, []);

  const handleCancelEdit = useCallback(() => {
    requestDiscard(() => setEditingBranding(false));
  }, [requestDiscard]);

  const handlePhotoToggle = useCallback((url: string) => {
    setSelectedPhotos((prev) => {
      const i = prev.indexOf(url);
      if (i === -1) return [...prev, url];
      return prev.filter((u) => u !== url);
    });
  }, []);

  const handleLanguageToggle = useCallback((lang: Language) => {
    setSelectedLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang],
    );
  }, []);

  const handleDownload = useCallback(async () => {
    if (selectedLanguages.length === 0) return;
    setIsDownloading(true);
    try {
      await downloadPDF(property.id, {
        languages: selectedLanguages,
        includeBranding: !!profile,
        selectedPhotos,
      });
      toast.success(t("toastDownloaded"));
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("toastFailed"));
    } finally {
      setIsDownloading(false);
    }
  }, [property.id, selectedLanguages, profile, selectedPhotos, onOpenChange, t]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        {isLoadingProfile ? (
          <>
            <DialogHeader>
              <DialogTitle className="font-serif text-navy-deep">
                {t("title")}
              </DialogTitle>
              <DialogDescription>{t("loading")}</DialogDescription>
            </DialogHeader>
            <div className="flex items-center justify-center py-12">
              <div
                className="size-6 border-2 border-gold border-t-transparent rounded-full animate-spin motion-reduce:animate-none"
                role="status"
                aria-label={t("ariaLoading")}
              />
            </div>
          </>
        ) : editingBranding ? (
          <BrandingStep
            profile={profile}
            onSaved={handleProfileSaved}
            onCancel={handleCancelEdit}
            onDirtyChange={setBrandingDirty}
          />
        ) : wizard.current === "photos" ? (
          <PhotosStep
            stepIndex={wizard.index}
            totalSteps={wizard.totalSteps}
            photoUrls={property.photo_urls}
            selectedPhotos={selectedPhotos}
            maxPhotos={MAX_PHOTOS}
            onTogglePhoto={handlePhotoToggle}
            onClearPhotos={() => setSelectedPhotos([])}
            onBack={null}
            onContinue={wizard.goNext}
          />
        ) : (
          <LanguagesStep
            stepIndex={wizard.index}
            totalSteps={wizard.totalSteps}
            profile={profile}
            selectedLanguages={selectedLanguages}
            onToggleLanguage={handleLanguageToggle}
            onEditBranding={handleEditBranding}
            onBack={wizard.goBack}
            onDownload={handleDownload}
            isDownloading={isDownloading}
          />
        )}
      </DialogContent>

      <ConfirmDiscardDialog
        open={discardConfirmOpen}
        onOpenChange={(next) => {
          if (!next) handleKeepEditing();
        }}
        onConfirm={handleConfirmDiscard}
        onCancel={handleKeepEditing}
        title={t("discardBrandingTitle")}
        description={t("discardBrandingDescription")}
      />
    </Dialog>
  );
}

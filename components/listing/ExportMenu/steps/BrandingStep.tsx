"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogScrollBody,
  DialogStickyFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import BrandingForm, { BRANDING_FORM_ID } from "@/components/profile/BrandingForm";
import type { AgentProfile } from "@/lib/types";

interface BrandingStepProps {
  /** Profile to edit, or null for first-time setup. */
  profile: AgentProfile | null;
  /** Called when the form successfully saves a profile. */
  onSaved: (profile: AgentProfile) => void;
  /** Called when the user clicks Cancel — returns to the Languages step. */
  onCancel: () => void;
  /**
   * Forwards the form's dirty state to the wizard, which uses it to guard
   * every discard path (Cancel, X, overlay click, Esc) with a confirmation
   * dialog so unsaved branding edits aren't silently lost.
   */
  onDirtyChange?: (dirty: boolean) => void;
}

/**
 * Branding sub-flow — reached only from the Languages step's Add/Edit card.
 * Not numbered as a wizard step since it's accessed on demand, not as part
 * of the linear Photos → Languages flow.
 */
export default function BrandingStep({
  profile,
  onSaved,
  onCancel,
  onDirtyChange,
}: BrandingStepProps) {
  const [isPending, setIsPending] = useState(false);
  const [canSubmit, setCanSubmit] = useState(false);
  const t = useTranslations("wizard.listing.pdfWizard.branding");

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-serif text-navy-deep">
          {profile ? t("titleEdit") : t("titleSetup")}
        </DialogTitle>
        <DialogDescription>{t("description")}</DialogDescription>
      </DialogHeader>

      <DialogScrollBody>
        <BrandingForm
          profile={profile}
          onSuccess={onSaved}
          hideActions
          onPendingChange={setIsPending}
          onValidityChange={setCanSubmit}
          onDirtyChange={onDirtyChange}
        />
      </DialogScrollBody>

      <DialogStickyFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isPending}
          className="rounded-lg border-gray-300 shadow-none"
        >
          {t("cancel")}
        </Button>
        <Button
          type="submit"
          form={BRANDING_FORM_ID}
          disabled={!canSubmit || isPending}
          className="gap-1.5 rounded-lg bg-gold text-navy-deep hover:bg-gold/90 shadow-none"
        >
          {isPending && (
            <div
              className="size-4 border-2 border-navy-deep border-t-transparent rounded-full animate-spin motion-reduce:animate-none"
              role="status"
              aria-label={t("ariaSaving")}
            />
          )}
          {t("saveChanges")}
        </Button>
      </DialogStickyFooter>
    </>
  );
}

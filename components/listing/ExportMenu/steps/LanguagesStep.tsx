"use client";

import { useTranslations } from "next-intl";
import { ArrowLeft, FileDown, Loader2, UserPlus } from "lucide-react";
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogScrollBody,
  DialogStickyFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { LANGUAGES, LANGUAGE_LABELS } from "@/lib/constants";
import { hasNoBranding } from "@/lib/schemas/profile";
import type { AgentProfile, Language } from "@/lib/types";

interface LanguagesStepProps {
  stepIndex: number;
  totalSteps: number;
  profile: AgentProfile | null;
  selectedLanguages: Language[];
  onToggleLanguage: (lang: Language) => void;
  onEditBranding: () => void;
  onBack: () => void;
  onDownload: () => void;
  isDownloading: boolean;
}

export default function LanguagesStep({
  stepIndex,
  totalSteps,
  profile,
  selectedLanguages,
  onToggleLanguage,
  onEditBranding,
  onBack,
  onDownload,
  isDownloading,
}: LanguagesStepProps) {
  const isEmpty = hasNoBranding(profile);
  const t = useTranslations("wizard.listing.pdfWizard.languages");

  return (
    <>
      <DialogHeader>
        <div className="text-2xs text-gray-400 uppercase tracking-wider mb-1">
          {t("stepLabel", { step: stepIndex, total: totalSteps })}
        </div>
        <DialogTitle className="font-serif text-navy-deep">
          {t("title")}
        </DialogTitle>
        <DialogDescription>{t("description")}</DialogDescription>
      </DialogHeader>

      <DialogScrollBody>
        <div className="flex flex-col gap-4 py-2">
          {/* Branding card — always rendered. Empty state (no profile, or
              profile with all fields cleared) shows the "Add your branding"
              dashed-border affordance. Populated state shows logo/initial +
              name/agency + Edit. Identical structure either way. */}
          <div className="flex items-center justify-between rounded-xl bg-gold/5 border border-gold/20 px-4 py-3">
            <div className="flex items-center gap-3 min-w-0">
              {isEmpty ? (
                <div className="size-11 rounded-full border-2 border-dashed border-gold/40 flex items-center justify-center text-gold shrink-0">
                  <UserPlus className="size-5" />
                </div>
              ) : profile?.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.logo_url}
                  alt=""
                  className="size-11 rounded-full border border-gold/20 object-cover shrink-0 bg-white"
                />
              ) : (
                <div className="size-11 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center text-gold font-semibold text-sm shrink-0">
                  {((profile?.full_name || profile?.agency_name || "?") as string)
                    .charAt(0)
                    .toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                {isEmpty ? (
                  <>
                    <p className="text-sm font-semibold text-navy-deep">
                      {t("addBranding")}
                    </p>
                    <p className="text-2xs text-gray-500 uppercase tracking-wider">
                      {t("addBrandingHint")}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-navy-deep truncate">
                      {profile?.full_name || profile?.agency_name}
                    </p>
                    {profile?.agency_name && profile?.full_name && (
                      <p className="text-2xs text-gray-500 uppercase tracking-wider truncate">
                        {profile.agency_name}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={onEditBranding}
              className="text-sm font-medium text-gold hover:text-gold/80 transition-colors cursor-pointer shrink-0 ml-2"
            >
              {isEmpty ? t("add") : t("edit")}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {LANGUAGES.map((lang) => {
              const checked = selectedLanguages.includes(lang);
              return (
                <div
                  key={lang}
                  role="checkbox"
                  aria-checked={checked}
                  aria-label={LANGUAGE_LABELS[lang]}
                  tabIndex={0}
                  onClick={() => onToggleLanguage(lang)}
                  onKeyDown={(e) => {
                    if (e.key === " " || e.key === "Enter") {
                      e.preventDefault();
                      onToggleLanguage(lang);
                    }
                  }}
                  className={`flex items-center gap-2.5 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1 ${
                    checked
                      ? "border-gold bg-gold/5"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <Checkbox
                    checked={checked}
                    tabIndex={-1}
                    className="pointer-events-none"
                  />
                  <span className="text-sm text-navy-deep font-medium">
                    {LANGUAGE_LABELS[lang]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </DialogScrollBody>

      <DialogStickyFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isDownloading}
          className="gap-1.5 rounded-lg border-gray-300 shadow-none"
        >
          <ArrowLeft className="size-3.5" />
          {t("back")}
        </Button>
        <Button
          onClick={onDownload}
          disabled={selectedLanguages.length === 0 || isDownloading}
          className="h-11 gap-2 rounded-lg bg-gold text-navy-deep hover:bg-gold/90 shadow-none font-semibold"
        >
          {isDownloading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <FileDown className="size-4" />
          )}
          {isDownloading ? t("generatingPdf") : t("downloadPdf")}
        </Button>
      </DialogStickyFooter>
    </>
  );
}

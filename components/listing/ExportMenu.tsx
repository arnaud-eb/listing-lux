"use client";

import { useState, useRef, useCallback } from "react";
import {
  Download,
  Globe,
  Mail,
  Share2,
  FileDown,
  Copy,
  Check,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  DialogDescription,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import type { Language, Listing, Property, AgentProfile } from "@/lib/types";
import { LANGUAGES, LANGUAGE_LABELS } from "@/lib/constants";
import { getAgentProfile } from "@/app/(wizard)/profile/actions";
import { downloadPDF } from "@/lib/pdf-client";
import BrandingForm from "@/components/profile/BrandingForm";
import {
  formatForAthome,
  formatForImmotop,
  formatForEmail,
  formatForSocialMedia,
  ATHOME_CHAR_LIMIT,
  IMMOTOP_CHAR_LIMIT,
} from "@/lib/copy-formatter";
import { copyPlainText, copyRichText } from "@/lib/clipboard";

interface ExportMenuProps {
  hideTextOnMobile?: boolean;
  listing: Partial<Listing> | null;
  property: Property | null;
  activeLanguage: Language | null;
  isEditing?: boolean;
  isGenerating?: boolean;
}

export default function ExportMenu({
  hideTextOnMobile,
  listing,
  property,
  activeLanguage,
  isEditing,
  isGenerating,
}: ExportMenuProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);
  const copyCountRef = useRef(0);

  // PDF dialog state
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const [pdfDialogState, setPdfDialogState] = useState<
    "loading" | "branding" | "languages"
  >("loading");
  const [profile, setProfile] = useState<AgentProfile | null>(null);
  const [selectedLanguages, setSelectedLanguages] = useState<Language[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);

  const hasCompleteListing = listing?.title && listing?.description;
  const isDisabled = !hasCompleteListing || isEditing || isGenerating;

  // Determine which languages have completed listings (for the PDF selector)
  // We only know the active language's listing here — the dialog fetches the rest
  const completedLanguages = LANGUAGES.filter(() => {
    // For now, we'll rely on the API to filter. Pre-select all.
    return true;
  });

  const handlePdfClick = useCallback(async () => {
    setPopoverOpen(false);
    setPdfDialogOpen(true);
    setPdfDialogState("loading");

    try {
      const fetchedProfile = await getAgentProfile();
      setProfile(fetchedProfile);
      if (fetchedProfile) {
        setPdfDialogState("languages");
        setSelectedLanguages([...LANGUAGES]);
      } else {
        setPdfDialogState("branding");
      }
    } catch {
      setPdfDialogState("branding");
    }
  }, []);

  const handleDownloadPdf = useCallback(async () => {
    if (!property || selectedLanguages.length === 0) return;

    setIsDownloading(true);
    try {
      await downloadPDF(property.id, selectedLanguages, !!profile);
      toast.success("PDF downloaded!");
      setPdfDialogOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "PDF generation failed");
    } finally {
      setIsDownloading(false);
    }
  }, [property, selectedLanguages, profile]);

  const handleSkipBranding = useCallback(() => {
    // Go to language selector without a profile — PDF will be unbranded
    setProfile(null);
    setPdfDialogState("languages");
    setSelectedLanguages([...LANGUAGES]);
  }, []);

  // Compute formats only when listing has content (not during streaming)
  const athomeResult = hasCompleteListing ? formatForAthome(listing!) : null;
  const immotopResult = hasCompleteListing ? formatForImmotop(listing!) : null;

  async function handleCopy(format: string) {
    if (!listing || !property) return;

    try {
      switch (format) {
        case "athome": {
          const result = formatForAthome(listing);
          await copyPlainText(result.text);
          break;
        }
        case "immotop": {
          const result = formatForImmotop(listing);
          await copyPlainText(result.text);
          break;
        }
        case "email": {
          const result = formatForEmail(listing, property);
          await copyRichText(result.html, result.plainText);
          break;
        }
        case "social": {
          const text = formatForSocialMedia(listing, property);
          await copyPlainText(text);
          break;
        }
      }

      // Visual feedback on the clicked row
      setCopiedFormat(format);
      setTimeout(() => setCopiedFormat(null), 2000);

      // Increment copy count and show appropriate toast
      copyCountRef.current++;
      if (copyCountRef.current >= 3) {
        toast("Listing copied!", {
          description: "Sign up free to save listings across devices",
          action: {
            label: "Sign Up",
            onClick: () => {
              /* wired in Phase 6 */
            },
          },
        });
      } else {
        toast.success("Copied to clipboard!");
      }
    } catch {
      toast.error("Failed to copy — try again");
    }
  }

  return (
    <>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={isDisabled}
            className="gap-1.5 rounded-lg border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-navy-deep shadow-none"
          >
            <Download size={14} />
            <span className={hideTextOnMobile ? "max-sm:hidden" : undefined}>
              Export
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          side="top"
          align="end"
          className="max-w-90 w-[calc(100vw-2rem)] p-0"
        >
          <PopoverArrow className="fill-white" />

          {/* COPY LISTING section */}
          <div className="p-4 pb-3">
            <p className="text-2xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Copy Listing
            </p>
            <div className="flex flex-col gap-1">
              {/* Athome.lu */}
              <CopyRow
                icon={<Globe className="size-4" />}
                label="Copy for Athome.lu"
                charCount={athomeResult?.charCount}
                charLimit={ATHOME_CHAR_LIMIT}
                isOverLimit={athomeResult?.isOverLimit}
                overBy={athomeResult?.overBy}
                isCopied={copiedFormat === "athome"}
                onClick={() => handleCopy("athome")}
              />

              {/* ImmoTop.lu */}
              <CopyRow
                icon={<Globe className="size-4" />}
                label="Copy for ImmoTop.lu"
                charCount={immotopResult?.charCount}
                charLimit={IMMOTOP_CHAR_LIMIT}
                isOverLimit={immotopResult?.isOverLimit}
                overBy={immotopResult?.overBy}
                isCopied={copiedFormat === "immotop"}
                onClick={() => handleCopy("immotop")}
              />

              {/* Email */}
              <CopyRow
                icon={<Mail className="size-4" />}
                label="Copy for Email"
                isCopied={copiedFormat === "email"}
                onClick={() => handleCopy("email")}
              />

              {/* Social Media */}
              <CopyRow
                icon={<Share2 className="size-4" />}
                label="Copy for Social Media"
                isCopied={copiedFormat === "social"}
                onClick={() => handleCopy("social")}
              />
            </div>
          </div>

          <Separator />

          {/* EXPORT section */}
          <div className="p-4 pt-3">
            <p className="text-2xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Export
            </p>
            <div className="flex flex-col gap-1">
              {/* PDF */}
              <button
                type="button"
                className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer text-left"
                onClick={handlePdfClick}
              >
                <FileDown className="size-4 shrink-0" />
                <span>Download PDF</span>
              </button>

              {/* Send via Email — Coming Soon */}
              <div className="flex items-center gap-3 px-3 py-2 text-sm text-gray-400">
                <Mail className="size-4 shrink-0" />
                <span>Send via Email</span>
                <Badge
                  variant="outline"
                  className="ml-auto text-2xs text-gold border-gold/30"
                >
                  Coming Soon
                </Badge>
              </div>

              {/* Post to Social Media — Coming Soon */}
              <div className="flex items-center gap-3 px-3 py-2 text-sm text-gray-400">
                <Share2 className="size-4 shrink-0" />
                <span>Post to Social Media</span>
                <Badge
                  variant="outline"
                  className="ml-auto text-2xs text-gold border-gold/30"
                >
                  Coming Soon
                </Badge>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* PDF Export Dialog */}
      <Dialog open={pdfDialogOpen} onOpenChange={setPdfDialogOpen}>
        <DialogContent className="max-w-md">
          {pdfDialogState === "loading" && (
            <>
              <DialogHeader>
                <DialogTitle className="font-serif text-navy-deep">
                  Export as PDF
                </DialogTitle>
                <DialogDescription>Loading your profile...</DialogDescription>
              </DialogHeader>
              <div className="flex items-center justify-center py-12">
                <div
                  className="size-6 border-2 border-gold border-t-transparent rounded-full animate-spin motion-reduce:animate-none"
                  role="status"
                  aria-label="Loading profile"
                />
              </div>
            </>
          )}

          {pdfDialogState === "branding" && (
            <>
              <DialogHeader>
                <DialogTitle className="font-serif text-navy-deep">
                  Set Up Your Branding
                </DialogTitle>
                <DialogDescription>
                  Add your contact info to appear on the PDF
                </DialogDescription>
              </DialogHeader>
              <BrandingForm
                profile={profile}
                showSkip={!profile}
                onSkip={handleSkipBranding}
                submitLabel={profile ? "Save & Continue" : "Save & Generate PDF"}
                onSuccess={(savedProfile) => {
                  setProfile(savedProfile);
                  setPdfDialogState("languages");
                  setSelectedLanguages([...LANGUAGES]);
                }}
              />
            </>
          )}

          {pdfDialogState === "languages" && (
            <>
              <DialogHeader>
                <DialogTitle className="font-serif text-navy-deep">
                  Export as PDF
                </DialogTitle>
                <DialogDescription>
                  Select which languages to include
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4 py-2">
                {/* Current branding preview with inline edit */}
                {profile && (
                  <div className="flex items-center justify-between rounded-xl bg-gold/5 border border-gold/20 px-4 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {profile.logo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={profile.logo_url}
                          alt=""
                          className="size-11 rounded-full border border-gold/20 object-cover shrink-0 bg-white"
                        />
                      ) : (
                        <div className="size-11 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center text-gold font-semibold text-sm shrink-0">
                          {profile.full_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-navy-deep truncate">
                          {profile.full_name}
                        </p>
                        {profile.agency_name && (
                          <p className="text-2xs text-gray-500 uppercase tracking-wider truncate">
                            {profile.agency_name}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPdfDialogState("branding")}
                      className="text-sm font-medium text-gold hover:text-gold/80 transition-colors cursor-pointer shrink-0 ml-2"
                    >
                      Edit
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2.5">
                  {LANGUAGES.map((lang) => {
                    const checked = selectedLanguages.includes(lang);
                    const toggle = () => {
                      if (checked) {
                        setSelectedLanguages((prev) => prev.filter((l) => l !== lang));
                      } else {
                        setSelectedLanguages((prev) => [...prev, lang]);
                      }
                    };
                    return (
                      <div
                        key={lang}
                        role="checkbox"
                        aria-checked={checked}
                        aria-label={LANGUAGE_LABELS[lang]}
                        tabIndex={0}
                        onClick={toggle}
                        onKeyDown={(e) => {
                          if (e.key === " " || e.key === "Enter") {
                            e.preventDefault();
                            toggle();
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
                <Button
                  onClick={handleDownloadPdf}
                  disabled={selectedLanguages.length === 0 || isDownloading}
                  className="w-full h-11 gap-2 rounded-lg bg-gold text-navy-deep hover:bg-gold/90 shadow-none font-semibold"
                >
                  {isDownloading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <FileDown className="size-4" />
                  )}
                  {isDownloading ? "Generating PDF..." : "Download PDF"}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// --- Copy Row Component ---

interface CopyRowProps {
  icon: React.ReactNode;
  label: string;
  charCount?: number;
  charLimit?: number;
  isOverLimit?: boolean;
  overBy?: number;
  isCopied: boolean;
  onClick: () => void;
}

function CopyRow({
  icon,
  label,
  charCount,
  charLimit,
  isOverLimit,
  overBy,
  isCopied,
  onClick,
}: CopyRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer text-left group"
      aria-label={`${label}${isCopied ? " — copied" : ""}`}
    >
      <span className="shrink-0 text-gray-500">{icon}</span>
      <span className="flex-1 min-w-0">
        <span className="block">{label}</span>
        {charCount !== undefined && charLimit !== undefined && (
          <span
            className={`block text-2xs mt-0.5 ${
              isOverLimit ? "text-red-500 font-medium" : "text-gray-400"
            }`}
            aria-live="polite"
          >
            {isOverLimit
              ? `Over by ${overBy} chars — try regenerating with 'more concise'`
              : `${charCount.toLocaleString()} / ${charLimit.toLocaleString()} chars`}
          </span>
        )}
      </span>
      <span className="shrink-0">
        {isCopied ? (
          <Check className="size-4 text-green-500" />
        ) : (
          <Copy className="size-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </span>
    </button>
  );
}

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Globe,
  Mail,
  Share2,
  FileDown,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  formatForAthome,
  formatForImmotop,
  ATHOME_CHAR_LIMIT,
  IMMOTOP_CHAR_LIMIT,
} from "@/lib/copy-formatter";
import type { Listing, Property } from "@/lib/types";
import { formatNumber } from "@/lib/format";
import { FORMATTERS, type CopyFormat } from "./formatters";

interface CopyMenuProps {
  listing: Partial<Listing>;
  property: Property;
  onPdfClick: () => void;
}

/**
 * Inner content of the export menu — Copy section + Export section.
 * Rendered inside a Popover on desktop and a Dialog (bottom sheet) on mobile.
 */
export default function CopyMenu({
  listing,
  property,
  onPdfClick,
}: CopyMenuProps) {
  const [copiedFormat, setCopiedFormat] = useState<CopyFormat | null>(null);
  const t = useTranslations("wizard.listing.exportMenu");
  const tCommon = useTranslations("common");

  const athomeResult = formatForAthome(listing);
  const immotopResult = formatForImmotop(listing);

  async function handleCopy(format: CopyFormat) {
    try {
      await FORMATTERS[format]({ listing, property });

      setCopiedFormat(format);
      setTimeout(() => setCopiedFormat(null), 2000);

      toast.success(t("toastCopied"));
    } catch {
      toast.error(t("toastCopyFailed"));
    }
  }

  return (
    <>
      <div className="p-4 pb-3">
        <p className="text-2xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          {t("copyListing")}
        </p>
        <div className="flex flex-col gap-1">
          <CopyRow
            icon={<Globe className="size-4" />}
            label={t("copyAthome")}
            charCount={athomeResult.charCount}
            charLimit={ATHOME_CHAR_LIMIT}
            isOverLimit={athomeResult.isOverLimit}
            overBy={athomeResult.overBy}
            isCopied={copiedFormat === "athome"}
            onClick={() => handleCopy("athome")}
          />
          <CopyRow
            icon={<Globe className="size-4" />}
            label={t("copyImmotop")}
            charCount={immotopResult.charCount}
            charLimit={IMMOTOP_CHAR_LIMIT}
            isOverLimit={immotopResult.isOverLimit}
            overBy={immotopResult.overBy}
            isCopied={copiedFormat === "immotop"}
            onClick={() => handleCopy("immotop")}
          />
          <CopyRow
            icon={<Mail className="size-4" />}
            label={t("copyEmail")}
            isCopied={copiedFormat === "email"}
            onClick={() => handleCopy("email")}
          />
          <CopyRow
            icon={<Share2 className="size-4" />}
            label={t("copySocial")}
            isCopied={copiedFormat === "social"}
            onClick={() => handleCopy("social")}
          />
        </div>
      </div>

      <Separator />

      <div className="p-4 pt-3">
        <p className="text-2xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          {t("exportSection")}
        </p>
        <div className="flex flex-col gap-1">
          <button
            type="button"
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer text-left"
            onClick={onPdfClick}
          >
            <FileDown className="size-4 shrink-0" />
            <span>{t("downloadPdf")}</span>
          </button>

          <div className="flex items-center gap-3 px-3 py-2 text-sm text-gray-400">
            <Mail className="size-4 shrink-0" />
            <span>{t("sendEmail")}</span>
            <Badge
              variant="outline"
              className="ml-auto text-2xs text-gold border-gold/30"
            >
              {tCommon("comingSoon")}
            </Badge>
          </div>

          <div className="flex items-center gap-3 px-3 py-2 text-sm text-gray-400">
            <Share2 className="size-4 shrink-0" />
            <span>{t("postSocial")}</span>
            <Badge
              variant="outline"
              className="ml-auto text-2xs text-gold border-gold/30"
            >
              {tCommon("comingSoon")}
            </Badge>
          </div>
        </div>
      </div>
    </>
  );
}

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
  const t = useTranslations("wizard.listing.exportMenu");
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer text-left group"
      aria-label={isCopied ? t("ariaCopied", { label }) : label}
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
              ? t("overByChars", { count: overBy ?? 0 })
              : t("charCount", {
                  current: formatNumber(charCount),
                  limit: formatNumber(charLimit),
                })}
          </span>
        )}
      </span>
      <span className="shrink-0">
        {isCopied ? (
          <Check className="size-4 text-gold" />
        ) : (
          <Copy className="size-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </span>
    </button>
  );
}

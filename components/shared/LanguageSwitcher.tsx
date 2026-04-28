"use client";

import { Globe, Check } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const LOCALE_LABELS: Record<(typeof routing.locales)[number], { short: string; long: string }> = {
  fr: { short: "FR", long: "Français" },
  en: { short: "EN", long: "English" },
};

interface LanguageSwitcherProps {
  variant?: "desktop" | "mobile";
}

export default function LanguageSwitcher({ variant = "desktop" }: LanguageSwitcherProps) {
  const locale = useLocale() as (typeof routing.locales)[number];
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("common");
  const [isPending, startTransition] = useTransition();

  function switchTo(next: (typeof routing.locales)[number]) {
    if (next === locale) return;
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
  }

  if (variant === "mobile") {
    return (
      <div
        className="flex gap-2 px-6 pb-4"
        role="group"
        aria-label={t("changeLanguage")}
      >
        {routing.locales.map((code) => {
          const isActive = code === locale;
          return (
            <button
              key={code}
              type="button"
              onClick={() => switchTo(code)}
              disabled={isPending}
              aria-pressed={isActive}
              className={`flex-1 py-2 rounded-lg border text-sm font-bold transition-colors disabled:opacity-50 ${
                isActive
                  ? "border-gold bg-gold/10 text-gold"
                  : "border-gray-200 text-navy-deep hover:border-gold hover:text-gold"
              }`}
            >
              {LOCALE_LABELS[code].short}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <Popover>
      <PopoverTrigger
        className="p-2 text-navy-deep hover:text-gold transition-colors flex items-center gap-1.5 text-sm font-bold rounded-md outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
        aria-label={t("changeLanguage")}
      >
        <Globe className="size-4" />
        <span>{LOCALE_LABELS[locale].short}</span>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-44 p-1">
        {routing.locales.map((code) => {
          const isActive = code === locale;
          return (
            <button
              key={code}
              type="button"
              onClick={() => switchTo(code)}
              disabled={isPending}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors cursor-pointer disabled:opacity-50 ${
                isActive
                  ? "text-gold font-semibold"
                  : "text-navy-deep hover:bg-gold/5 hover:text-gold"
              }`}
            >
              <span>{LOCALE_LABELS[code].long}</span>
              {isActive && <Check className="size-4 text-gold" />}
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}

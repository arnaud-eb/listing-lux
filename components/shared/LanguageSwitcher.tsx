"use client";

import { Globe, Check } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
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
            <Button
              key={code}
              type="button"
              variant="outline"
              onClick={() => switchTo(code)}
              disabled={isPending}
              aria-pressed={isActive}
              className={`flex-1 rounded-lg shadow-none font-bold ${
                isActive
                  ? "border-gold bg-gold/10 text-gold hover:bg-gold/15 hover:text-gold"
                  : "border-gray-200 text-navy-deep hover:border-gold hover:text-gold"
              }`}
            >
              {LOCALE_LABELS[code].short}
            </Button>
          );
        })}
      </div>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label={t("changeLanguage")}
          className="text-navy-deep hover:text-gold font-bold"
        >
          <Globe className="size-4" />
          {LOCALE_LABELS[locale].short}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-44 p-1">
        {routing.locales.map((code) => {
          const isActive = code === locale;
          return (
            <Button
              key={code}
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => switchTo(code)}
              disabled={isPending}
              className={`w-full justify-between font-normal ${
                isActive
                  ? "text-gold font-semibold"
                  : "text-navy-deep hover:text-gold"
              }`}
            >
              <span>{LOCALE_LABELS[code].long}</span>
              {isActive && <Check className="size-4 text-gold" />}
            </Button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}

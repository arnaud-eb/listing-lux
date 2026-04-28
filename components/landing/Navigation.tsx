"use client";

import { useTranslations } from "next-intl";
import { Menu, X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import Logo from "@/components/shared/Logo";
import LanguageSwitcher from "@/components/shared/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetClose,
  SheetTitle,
} from "@/components/ui/sheet";

const NAV_LINKS = [
  { key: "efficiency", href: "#comparison" },
  { key: "howItWorks", href: "#how-it-works" },
  { key: "pricing", href: "#pricing" },
  { key: "contact", href: "#contact" },
] as const;

export default function Navigation() {
  const t = useTranslations("navigation");
  const tCommon = useTranslations("common");

  return (
    <>
      <header className="flex items-center justify-between border-b border-gold/20 px-6 py-4 lg:px-20 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <Logo />

        {/* Desktop nav */}
        <nav className="flex items-center gap-8 max-md:hidden">
          {NAV_LINKS.map(({ key, href }) => (
            <a
              key={href}
              className="text-sm font-medium hover:text-gold transition-colors focus-visible:text-gold outline-none focus-visible:underline underline-offset-4"
              href={href}
            >
              {t(`links.${key}`)}
            </a>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="flex items-center gap-3 max-md:hidden">
          <LanguageSwitcher variant="desktop" />
          <Button
            variant="outline"
            className="rounded-lg h-10 px-5 border-gold text-gold font-bold shadow-none hover:bg-gold/5 hover:text-gold"
          >
            {t("login")}
          </Button>
          <Button
            asChild
            className="rounded-lg h-10 px-5 bg-gold text-navy-deep font-bold shadow-lg shadow-gold/20 hover:scale-105 hover:bg-gold/90"
          >
            <Link href="/create">{t("tryDemo")}</Link>
          </Button>
        </div>

        {/* Mobile menu */}
        <Sheet>
          <SheetTrigger asChild>
            <button
              className="md:hidden p-2 -mr-2 text-navy-deep hover:text-gold transition-colors"
              aria-label={tCommon("openMenu")}
            >
              <Menu className="size-6" />
            </button>
          </SheetTrigger>
          <SheetContent
            side="top"
            showCloseButton={false}
            className="border-gold/20 shadow-xl bg-white p-0 gap-0 md:hidden"
          >
            <SheetTitle className="sr-only">{tCommon("navigationMenu")}</SheetTitle>

            {/* Header row — mirrors the sticky header */}
            <div className="flex items-center justify-between px-6 py-4">
              <Logo />
              <SheetClose className="p-2 -mr-2 text-navy-deep hover:text-gold transition-colors">
                <X className="size-6" />
                <span className="sr-only">{tCommon("closeMenu")}</span>
              </SheetClose>
            </div>

            {/* Nav links */}
            <nav className="flex flex-col px-6 pb-2">
              {NAV_LINKS.map(({ key, href }) => (
                <SheetClose asChild key={href}>
                  <a
                    href={href}
                    className="py-3 text-lg font-medium text-navy-deep hover:text-gold transition-colors border-b border-gray-100 last:border-0 focus-visible:text-gold outline-none focus-visible:underline underline-offset-4"
                  >
                    {t(`links.${key}`)}
                  </a>
                </SheetClose>
              ))}
            </nav>

            {/* Language switcher — appears above CTAs */}
            <LanguageSwitcher variant="mobile" />

            {/* CTAs */}
            <div className="flex flex-col gap-3 px-6 pt-4 pb-8">
              <Button
                variant="outline"
                className="rounded-lg h-12 w-full border-gold text-gold font-bold shadow-none hover:bg-gold/5 hover:text-gold"
              >
                {t("login")}
              </Button>
              <SheetClose asChild>
                <Button
                  asChild
                  className="rounded-lg h-12 w-full bg-gold text-navy-deep font-bold shadow-lg shadow-gold/20 hover:bg-gold/90"
                >
                  <Link href="/create">{t("tryDemo")}</Link>
                </Button>
              </SheetClose>
            </div>
          </SheetContent>
        </Sheet>
      </header>
    </>
  );
}

"use client";

import { useTranslations } from "next-intl";
import { Menu, X } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import Logo from "@/components/shared/Logo";
import LanguageSwitcher from "@/components/shared/LanguageSwitcher";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetClose,
  SheetTitle,
} from "@/components/ui/sheet";

interface WizardNavProps {
  hasSession: boolean;
  hasProfile?: boolean;
}

interface NavItem {
  key: "home" | "createListing" | "yourListings" | "profile";
  href: string;
  badge?: "incomplete";
}

function getNavLinks(hasSession: boolean, hasProfile?: boolean): NavItem[] {
  const links: NavItem[] = [
    { key: "home", href: "/" },
    { key: "createListing", href: "/create" },
  ];
  if (hasSession) {
    links.push({ key: "yourListings", href: "/history" });
  }
  links.push({
    key: "profile",
    href: "/profile",
    badge: hasProfile ? undefined : "incomplete",
  });
  return links;
}

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export default function WizardNav({ hasSession, hasProfile }: WizardNavProps) {
  const pathname = usePathname();
  const links = getNavLinks(hasSession, hasProfile);
  const t = useTranslations("wizardNav");
  const tCommon = useTranslations("common");

  return (
    <>
      {/* Desktop nav */}
      <nav className="flex items-center gap-6 ml-auto max-md:hidden">
        {links.map(({ key, href, badge }) => (
          <Link
            key={href}
            href={href}
            className={`text-sm font-medium transition-colors hover:text-gold focus-visible:text-gold outline-none focus-visible:underline underline-offset-4 ${
              isActive(pathname, href)
                ? "text-navy-deep underline underline-offset-8 decoration-gold decoration-2"
                : "text-gray-400"
            }`}
          >
            {t(key)}
            {badge === "incomplete" && (
              <span
                className="ml-1 inline-block size-1.5 bg-gold rounded-full"
                aria-label={t("profileIncomplete")}
              />
            )}
          </Link>
        ))}
        <LanguageSwitcher variant="desktop" />
      </nav>

      {/* Mobile menu */}
      <Sheet>
        <SheetTrigger asChild>
          <button
            className="md:hidden p-2 -mr-2 ml-auto text-navy-deep hover:text-gold transition-colors"
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
          <SheetTitle className="sr-only">
            {tCommon("navigationMenu")}
          </SheetTitle>

          {/* Header row */}
          <div className="flex items-center justify-between px-6 py-4">
            <Logo />
            <SheetClose className="p-2 -mr-2 text-navy-deep hover:text-gold transition-colors">
              <X className="size-6" />
              <span className="sr-only">{tCommon("closeMenu")}</span>
            </SheetClose>
          </div>

          {/* Nav links */}
          <nav className="flex flex-col px-6">
            {links.map(({ key, href }) => (
              <SheetClose asChild key={href}>
                <Link
                  href={href}
                  className={`py-3 text-lg font-medium transition-colors border-b border-gray-100 last:border-0 hover:text-gold focus-visible:text-gold outline-none focus-visible:underline underline-offset-4 ${
                    isActive(pathname, href) ? "text-gold" : "text-navy-deep"
                  }`}
                >
                  {t(key)}
                </Link>
              </SheetClose>
            ))}
          </nav>

          {/* Language switcher row */}
          <div className="pt-4 pb-8">
            <LanguageSwitcher variant="mobile" />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

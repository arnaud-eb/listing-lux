"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import Logo from "@/components/shared/Logo";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetClose,
  SheetTitle,
} from "@/components/ui/sheet";

interface WizardNavProps {
  hasSession: boolean;
}

interface NavItem {
  label: string;
  href: string;
}

function getNavLinks(hasSession: boolean): NavItem[] {
  const links: NavItem[] = [
    { label: "Home", href: "/" },
    { label: "Create Listing", href: "/create" },
  ];
  if (hasSession) {
    links.push({ label: "Your Listings", href: "/history" });
  }
  return links;
}

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export default function WizardNav({ hasSession }: WizardNavProps) {
  const pathname = usePathname();
  const links = getNavLinks(hasSession);

  return (
    <>
      {/* Desktop nav */}
      <nav className="flex items-center gap-6 ml-auto max-md:hidden">
        {links.map(({ label, href }) => (
          <Link
            key={href}
            href={href}
            className={`text-sm font-medium transition-colors hover:text-gold focus-visible:text-gold outline-none focus-visible:underline underline-offset-4 ${
              isActive(pathname, href)
                ? "text-navy-deep underline underline-offset-8 decoration-gold decoration-2"
                : "text-gray-400"
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>

      {/* Mobile menu */}
      <Sheet>
        <SheetTrigger asChild>
          <button
            className="md:hidden p-2 -mr-2 ml-auto text-navy-deep hover:text-gold transition-colors"
            aria-label="Open menu"
          >
            <Menu className="size-6" />
          </button>
        </SheetTrigger>
        <SheetContent
          side="top"
          showCloseButton={false}
          className="border-gold/20 shadow-xl bg-white p-0 gap-0 md:hidden"
        >
          <SheetTitle className="sr-only">Navigation menu</SheetTitle>

          {/* Header row */}
          <div className="flex items-center justify-between px-6 py-4">
            <Logo />
            <SheetClose className="p-2 -mr-2 text-navy-deep hover:text-gold transition-colors">
              <X className="size-6" />
              <span className="sr-only">Close menu</span>
            </SheetClose>
          </div>

          {/* Nav links */}
          <nav className="flex flex-col px-6 pb-8">
            {links.map(({ label, href }) => (
              <SheetClose asChild key={href}>
                <Link
                  href={href}
                  className={`py-3 text-lg font-medium transition-colors border-b border-gray-100 last:border-0 hover:text-gold focus-visible:text-gold outline-none focus-visible:underline underline-offset-4 ${
                    isActive(pathname, href) ? "text-gold" : "text-navy-deep"
                  }`}
                >
                  {label}
                </Link>
              </SheetClose>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}

"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import Logo from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetClose,
  SheetTitle,
} from "@/components/ui/sheet";

const NAV_LINKS = [
  { label: "Efficiency", href: "#comparison" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "Contact", href: "#contact" },
] as const;

export default function Navigation() {
  return (
    <>
      <header className="flex items-center justify-between border-b border-gold/20 px-6 py-4 lg:px-20 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <Logo />

        {/* Desktop nav */}
        <nav className="flex items-center gap-8 max-md:hidden">
          {NAV_LINKS.map(({ label, href }) => (
            <a
              key={href}
              className="text-sm font-medium hover:text-gold transition-colors focus-visible:text-gold outline-none focus-visible:underline underline-offset-4"
              href={href}
            >
              {label}
            </a>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="flex gap-3 max-md:hidden">
          <Button
            variant="outline"
            className="rounded-lg h-10 px-5 border-gold text-gold font-bold shadow-none hover:bg-gold/5 hover:text-gold"
          >
            Login
          </Button>
          <Button
            asChild
            className="rounded-lg h-10 px-5 bg-gold text-navy-deep font-bold shadow-lg shadow-gold/20 hover:scale-105 hover:bg-gold/90"
          >
            <Link href="/create">Try Demo</Link>
          </Button>
        </div>

        {/* Mobile menu */}
        <Sheet>
          <SheetTrigger asChild>
            <button
              className="md:hidden p-2 -mr-2 text-navy-deep hover:text-gold transition-colors"
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

            {/* Header row — mirrors the sticky header */}
            <div className="flex items-center justify-between px-6 py-4">
              <Logo />
              <SheetClose className="p-2 -mr-2 text-navy-deep hover:text-gold transition-colors">
                <X className="size-6" />
                <span className="sr-only">Close menu</span>
              </SheetClose>
            </div>

            {/* Nav links */}
            <nav className="flex flex-col px-6 pb-2">
              {NAV_LINKS.map(({ label, href }) => (
                <SheetClose asChild key={href}>
                  <a
                    href={href}
                    className="py-3 text-lg font-medium text-navy-deep hover:text-gold transition-colors border-b border-gray-100 last:border-0 focus-visible:text-gold outline-none focus-visible:underline underline-offset-4"
                  >
                    {label}
                  </a>
                </SheetClose>
              ))}
            </nav>

            {/* CTAs */}
            <div className="flex flex-col gap-3 px-6 pt-4 pb-8">
              <Button
                variant="outline"
                className="rounded-lg h-12 w-full border-gold text-gold font-bold shadow-none hover:bg-gold/5 hover:text-gold"
              >
                Login
              </Button>
              <SheetClose asChild>
                <Button
                  asChild
                  className="rounded-lg h-12 w-full bg-gold text-navy-deep font-bold shadow-lg shadow-gold/20 hover:bg-gold/90"
                >
                  <Link href="/create">Try Demo</Link>
                </Button>
              </SheetClose>
            </div>
          </SheetContent>
        </Sheet>
      </header>
    </>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import Logo from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { label: "Efficiency", href: "#comparison" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "Contact", href: "#contact" },
] as const;

export default function Navigation() {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (!mobileOpen) return;
    // Prevent conflicts with other scroll locks by saving/restoring previous value
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    return () => {
      document.body.style.overflow = prev;
      document.body.style.touchAction = "";
    };
  }, [mobileOpen]);

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

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(true)}
          className="md:hidden p-2 -mr-2 text-navy-deep hover:text-gold transition-colors"
          aria-label="Open menu"
        >
          <Menu className="size-6" />
        </button>
      </header>

      {/* Mobile overlay menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-navy-deep/40 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setMobileOpen(false)}
          />

          {/* Menu panel */}
          <div className="absolute inset-x-0 top-0 bg-white border-b border-gold/20 shadow-xl animate-in slide-in-from-top duration-300">
            {/* Header row — mirrors the sticky header */}
            <div className="flex items-center justify-between px-6 py-4">
              <Logo />
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 -mr-2 text-navy-deep hover:text-gold transition-colors"
                aria-label="Close menu"
              >
                <X className="size-6" />
              </button>
            </div>

            {/* Nav links */}
            <nav className="flex flex-col px-6 pb-2">
              {NAV_LINKS.map(({ label, href }, i) => (
                <a
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className="py-3 text-lg font-medium text-navy-deep hover:text-gold transition-colors border-b border-gray-100 last:border-0 focus-visible:text-gold outline-none focus-visible:underline underline-offset-4"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  {label}
                </a>
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
              <Button
                asChild
                className="rounded-lg h-12 w-full bg-gold text-navy-deep font-bold shadow-lg shadow-gold/20 hover:bg-gold/90"
              >
                <Link href="/create" onClick={() => setMobileOpen(false)}>
                  Try Demo
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

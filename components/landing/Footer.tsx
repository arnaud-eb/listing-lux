import Link from "next/link";
import Logo from "@/components/shared/Logo";

export default function Footer() {
  return (
    <footer className="bg-navy-deep text-slate-400 px-6 py-12 lg:px-20 border-t border-white/5">
      <div className="max-w-7xl mx-auto flex flex-row justify-between items-start md:items-center gap-8 max-md:flex-col">
        <div className="flex flex-col gap-4">
          <Logo textClassName="text-white" />
          <p className="text-sm max-w-xs">
            Built for Luxembourg real estate professionals
          </p>
        </div>

        <div className="flex gap-12">
          <div className="flex flex-col gap-3">
            <h4 className="text-white text-xs font-bold uppercase tracking-widest">
              Company
            </h4>
            <Link
              href="#"
              className="text-sm hover:text-gold transition-colors focus-visible:text-gold outline-none focus-visible:underline underline-offset-4"
            >
              About Us
            </Link>
            <Link
              href="/privacy"
              className="text-sm hover:text-gold transition-colors focus-visible:text-gold outline-none focus-visible:underline underline-offset-4"
            >
              Privacy
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            <h4 className="text-white text-xs font-bold uppercase tracking-widest">
              Support
            </h4>
            <Link
              href="#"
              className="text-sm hover:text-gold transition-colors focus-visible:text-gold outline-none focus-visible:underline underline-offset-4"
            >
              Documentation
            </Link>
            <Link
              href="/contact"
              className="text-sm hover:text-gold transition-colors focus-visible:text-gold outline-none focus-visible:underline underline-offset-4"
            >
              Contact
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-white/5 flex justify-between text-xs uppercase tracking-widest font-bold max-sm:flex-col max-sm:gap-4 max-sm:text-center">
        <p>
          &copy; {new Date().getFullYear()} ListingLux AI. All rights reserved.
        </p>
        <div className="flex gap-6 max-sm:justify-center">
          <a href="#" className="hover:text-white focus-visible:text-white outline-none focus-visible:underline underline-offset-4">
            Twitter
          </a>
          <a href="#" className="hover:text-white focus-visible:text-white outline-none focus-visible:underline underline-offset-4">
            LinkedIn
          </a>
        </div>
      </div>
    </footer>
  );
}

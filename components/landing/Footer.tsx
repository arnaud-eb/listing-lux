import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-[#1a2332] text-white/60 py-12">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between max-sm:flex-col max-sm:gap-6 max-sm:text-center">
          <div>
            <div className="text-white font-serif text-xl font-bold mb-1">ListingLux AI</div>
            <div className="text-sm">Built for Luxembourg real estate professionals</div>
          </div>

          <nav className="flex items-center gap-6 text-sm">
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms
            </Link>
            <Link href="/contact" className="hover:text-white transition-colors">
              Contact
            </Link>
          </nav>
        </div>

        <div className="border-t border-white/10 mt-8 pt-8 text-sm text-center">
          © {new Date().getFullYear()} ListingLux AI. All rights reserved.
        </div>
      </div>
    </footer>
  )
}

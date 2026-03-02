import Link from 'next/link'
import { Button } from '@/components/ui/button'

const LANGUAGES = ['DE', 'FR', 'EN', 'LU']

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background overlay */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-[#1a2332] via-[#1a2332]/90 to-[#1a2332]/70"
        aria-hidden="true"
      />
      {/* Decorative background pattern */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23C5A059' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 container mx-auto px-6 py-24 text-center">
        {/* Language badges */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {LANGUAGES.map((lang) => (
            <span
              key={lang}
              className="px-3 py-1 rounded-full text-sm font-medium border border-[#C5A059]/60 text-[#C5A059] bg-[#C5A059]/10"
            >
              {lang}
            </span>
          ))}
        </div>

        {/* Headline */}
        <h1 className="font-serif text-5xl font-bold text-white leading-tight max-w-3xl mx-auto mb-6 max-lg:text-4xl max-sm:text-3xl">
          Elevate Your Listings with{' '}
          <span className="text-[#C5A059]">Multilingual AI</span>
        </h1>

        {/* Subheading */}
        <p className="text-xl text-white/80 max-w-2xl mx-auto mb-10 leading-relaxed max-sm:text-lg">
          Generate professional property descriptions in DE/FR/EN/LU in seconds.
          Built for Luxembourg real estate agents.
        </p>

        {/* CTAs */}
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Button
            asChild
            variant="outline"
            size="lg"
            className="border-white/60 text-white bg-transparent hover:bg-white/10 hover:text-white hover:border-white"
          >
            <Link href="/demo">Try Demo</Link>
          </Button>
          <Button
            asChild
            size="lg"
            className="bg-[#C5A059] text-white hover:bg-[#C5A059]/90 border-0"
          >
            <Link href="/create">Create Listing</Link>
          </Button>
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-center gap-12 mt-16 pt-16 border-t border-white/10 max-sm:gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-[#C5A059] font-serif">4</div>
            <div className="text-sm text-white/60 mt-1">Languages</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-[#C5A059] font-serif">5 min</div>
            <div className="text-sm text-white/60 mt-1">Per listing</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-[#C5A059] font-serif">-96%</div>
            <div className="text-sm text-white/60 mt-1">Time saved</div>
          </div>
        </div>
      </div>
    </section>
  )
}

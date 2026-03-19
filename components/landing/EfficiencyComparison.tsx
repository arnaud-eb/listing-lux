import { X, CheckCircle, Sparkles } from "lucide-react";

export default function EfficiencyComparison() {
  return (
    <section className="bg-navy-deep/5 py-24 px-6 lg:px-20" id="comparison">
      <div className="text-center mb-16">
        <h2 className="font-serif text-4xl font-bold mb-4 max-md:text-3xl">
          Stop Spending Hours on Listings
        </h2>
        <p className="text-slate-600 max-w-2xl mx-auto">
          See the difference AI makes for your daily workflow
        </p>
      </div>

      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden border border-gold/10 flex flex-row max-md:flex-col">
        {/* Old Way */}
        <div className="p-10 flex-1 border-r border-slate-100 max-md:border-r-0 max-md:border-b" aria-label="Traditional copywriting approach">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-slate-400 font-bold uppercase tracking-widest text-xs">
              The Old Way
            </span>
          </div>
          <h4 className="font-serif text-2xl font-bold mb-4">
            Traditional Copywriting
          </h4>
          <ul className="space-y-4">
            <li className="flex items-start gap-3 text-slate-500 text-sm">
              <X className="text-red-400 size-4 mt-0.5 shrink-0" />
              2 hours of manual drafting
            </li>
            <li className="flex items-start gap-3 text-slate-500 text-sm">
              <X className="text-red-400 size-4 mt-0.5 shrink-0" />
              External translation costs
            </li>
            <li className="flex items-start gap-3 text-slate-500 text-sm">
              <X className="text-red-400 size-4 mt-0.5 shrink-0" />
              Inconsistent luxury tone
            </li>
          </ul>
          <div className="mt-8 pt-8 border-t border-slate-50">
            <p className="text-3xl font-light text-slate-400">
              Total: <span className="font-bold text-navy-deep">120+ mins</span>
            </p>
          </div>
        </div>

        {/* ListingLux Way */}
        <div className="p-10 flex-1 bg-gradient-to-br from-navy-deep to-slate-900 text-white relative" aria-label="ListingLux AI approach">
          <div className="absolute top-0 right-0 p-4" aria-hidden="true">
            <Sparkles className="text-gold/40 size-14" />
          </div>
          <div className="flex items-center gap-3 mb-6">
            <span className="text-gold font-bold uppercase tracking-widest text-xs">
              The ListingLux Way
            </span>
          </div>
          <h4 className="font-serif text-2xl font-bold mb-4">ListingLux AI</h4>
          <ul className="space-y-4">
            <li className="flex items-start gap-3 text-slate-300 text-sm">
              <CheckCircle className="text-gold size-4 mt-0.5 shrink-0" />
              Auto-generated in 5 minutes
            </li>
            <li className="flex items-start gap-3 text-slate-300 text-sm">
              <CheckCircle className="text-gold size-4 mt-0.5 shrink-0" />
              Native-level LU, FR, DE, EN
            </li>
            <li className="flex items-start gap-3 text-slate-300 text-sm">
              <CheckCircle className="text-gold size-4 mt-0.5 shrink-0" />
              Professional Sotheby&apos;s tone
            </li>
          </ul>
          <div className="mt-8 pt-8 border-t border-white/10">
            <p className="text-3xl font-light text-slate-300">
              Total: <span className="font-bold text-gold">5 mins</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
